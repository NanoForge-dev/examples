import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { Position } from "../components/position.component";
import { Velocity } from "../components/velocity.component";
import { Health } from "../components/health.component";
import { Hitbox } from "../components/hitbox.component";
import { Login } from "../components/login.component";
import { Zombie } from "../components/zombie.component";
import { type AIBehavior } from "../components/ia.component";
import { sendToInGamePlayers } from "../network-utils";

export const ZOMBIE_SPEED = 40;
export const ZOMBIE_MAX_HEALTH = 20;
export const ZOMBIE_ATTACK_RANGE = 8; // distance to a target's hitbox that lets it be attacked
export const ZOMBIE_AGGRO_RANGE = 40; // distance to a player's hitbox that starts a chase
export const ZOMBIE_ATTACK_DAMAGE = 5;
export const ZOMBIE_ATTACK_FRAME_RATE = 7;
export const ZOMBIE_ATTACK_FRAME_COUNT = 7;
export const ZOMBIE_ATTACK_DAMAGE_FRAME = 4; // 0-indexed - the "fifth" frame

interface Attackable {
  entityId: number;
  isLobby: boolean;
  position: Position;
  hitbox: Hitbox;
  health: Health;
  distance: number;
}

export function createZombieBehavior(lobbyEntityId: number): AIBehavior {
  return (registry: Registry, ctx: Context, entityId: number) => {
    const zombieEntity = registry.entityFromIndex(entityId);
    const position = registry.getEntityComponent(zombieEntity, Position);
    const velocity = registry.getEntityComponent(zombieEntity, Velocity);
    const hitbox = registry.getEntityComponent(zombieEntity, Hitbox);
    const zombie = registry.getEntityComponent(zombieEntity, Zombie);
    if (!position || !velocity || !hitbox || !zombie) return;

    const network = ctx.libs.getNetwork<NetworkServerLibrary>();
    const delta = ctx.app.delta / 1000;

    const attackable = gatherAttackable(registry, lobbyEntityId, position, hitbox);

    // Priority 1: attack whatever's already within range, right now - no distance beats being
    // attackable this instant.
    const inAttackRange = attackable.filter((e) => e.distance <= ZOMBIE_ATTACK_RANGE);

    if (inAttackRange.length > 0) {
      const target =
        inAttackRange.find((e) => e.entityId === zombie.lastAttackedTargetId) ?? nearest(inAttackRange);

      // Switching who we're hitting (a fresh attack, or the in-range target changed while still
      // mid-animation) resets the frame timer so the new target doesn't inherit a stale cycle.
      const switched = zombie.animationState !== "attack" || target.entityId !== zombie.lastAttackedTargetId;
      zombie.lastAttackedTargetId = target.entityId;

      if (switched) {
        zombie.attackElapsed = 0;
        zombie.hasDealtDamageThisCycle = false;
      }

      // Zero the velocity before broadcasting the transition, not after - otherwise the packet
      // still carries the old chase velocity, and since nothing corrects it again while the
      // attack continues, the client keeps dead-reckoning the zombie sliding forward until some
      // later transition snaps it back (looks like a teleport when it stops).
      velocity.x = 0;
      velocity.y = 0;

      if (zombie.animationState !== "attack") {
        zombie.animationState = "attack";
        broadcastZombieState(network, entityId, "attack", position, velocity);
      }

      zombie.attackElapsed += delta;
      const frame = Math.floor(zombie.attackElapsed * ZOMBIE_ATTACK_FRAME_RATE) % ZOMBIE_ATTACK_FRAME_COUNT;

      if (frame === ZOMBIE_ATTACK_DAMAGE_FRAME) {
        if (!zombie.hasDealtDamageThisCycle && target.health.current > 0) {
          target.health.current = Math.max(0, target.health.current - ZOMBIE_ATTACK_DAMAGE);
          zombie.hasDealtDamageThisCycle = true;
          sendToInGamePlayers(network, { type: "hit", id: target.entityId, damage: ZOMBIE_ATTACK_DAMAGE });
        }
      } else {
        zombie.hasDealtDamageThisCycle = false;
      }
      return;
    }

    // Priority 2: nothing attackable right now - move to the closest thing worth attacking. The
    // lobby is always a candidate; a player only counts within the aggro range.
    const reachable = attackable.filter((e) => e.isLobby || e.distance <= ZOMBIE_AGGRO_RANGE);
    const target = reachable.length > 0 ? nearest(reachable) : null;

    if (!target) {
      velocity.x = 0;
      velocity.y = 0;
      return;
    }

    const centerX = target.position.x + target.hitbox.offsetX + target.hitbox.width / 2;
    const centerY = target.position.y + target.hitbox.offsetY + target.hitbox.height / 2;
    const dx = centerX - position.x;
    const dy = centerY - position.y;
    const length = Math.hypot(dx, dy) || 1;
    velocity.x = (dx / length) * ZOMBIE_SPEED;
    velocity.y = (dy / length) * ZOMBIE_SPEED;

    // Broadcast whenever the client's dead-reckoning would otherwise drift: on the idle
    // transition itself, whenever the chase target changes (velocity direction jumps
    // discretely), or every tick while chasing a player (its center moves, so the steering curve
    // keeps changing even with the same target). The lobby is stationary, so once a straight-line
    // chase toward it starts, no further correction is needed until something changes.
    const targetChanged = target.entityId !== zombie.lastMoveTargetId;
    const needsBroadcast = zombie.animationState !== "idle" || targetChanged || !target.isLobby;
    zombie.lastMoveTargetId = target.entityId;
    zombie.animationState = "idle";
    if (needsBroadcast) {
      broadcastZombieState(network, entityId, "idle", position, velocity);
    }
  };
}

// Every living entity a zombie could target: the lobby plus every logged-in player, each with
// its edge-distance to the zombie's own hitbox precomputed.
function gatherAttackable(
  registry: Registry,
  lobbyEntityId: number,
  zombiePosition: Position,
  zombieHitbox: Hitbox,
): Attackable[] {
  const result: Attackable[] = [];

  const lobbyEntity = registry.entityFromIndex(lobbyEntityId);
  const lobbyPosition = registry.getEntityComponent(lobbyEntity, Position);
  const lobbyHitbox = registry.getEntityComponent(lobbyEntity, Hitbox);
  const lobbyHealth = registry.getEntityComponent(lobbyEntity, Health);
  if (lobbyPosition && lobbyHitbox && lobbyHealth && lobbyHealth.current > 0) {
    result.push({
      entityId: lobbyEntityId,
      isLobby: true,
      position: lobbyPosition,
      hitbox: lobbyHitbox,
      health: lobbyHealth,
      distance: distanceBetweenHitboxes(zombiePosition, zombieHitbox, lobbyPosition, lobbyHitbox),
    });
  }

  const players: { id: number; Position: Position; Hitbox: Hitbox; Health: Health }[] = registry.getIndexedZipper([
    Position,
    Hitbox,
    Health,
    Login,
  ]);

  for (const player of players) {
    if (player.Health.current <= 0) continue;
    result.push({
      entityId: player.id,
      isLobby: false,
      position: player.Position,
      hitbox: player.Hitbox,
      health: player.Health,
      distance: distanceBetweenHitboxes(zombiePosition, zombieHitbox, player.Position, player.Hitbox),
    });
  }

  return result;
}

function nearest(entities: Attackable[]): Attackable {
  return entities.reduce((closest, entity) => (entity.distance < closest.distance ? entity : closest));
}

// Minimum distance between two axis-aligned boxes (0 when they overlap) - the gap between
// whichever pair of edges/corners is closest. This is what "8 pixels of the hitbox" actually
// means for a zombie that has its own footprint, not just a point: a zero-size box reduces this
// to plain point-to-box distance.
function distanceBetweenHitboxes(aPosition: Position, aHitbox: Hitbox, bPosition: Position, bHitbox: Hitbox): number {
  const aLeft = aPosition.x + aHitbox.offsetX;
  const aTop = aPosition.y + aHitbox.offsetY;
  const aRight = aLeft + aHitbox.width;
  const aBottom = aTop + aHitbox.height;

  const bLeft = bPosition.x + bHitbox.offsetX;
  const bTop = bPosition.y + bHitbox.offsetY;
  const bRight = bLeft + bHitbox.width;
  const bBottom = bTop + bHitbox.height;

  const dx = Math.max(bLeft - aRight, aLeft - bRight, 0);
  const dy = Math.max(bTop - aBottom, aTop - bBottom, 0);
  return Math.hypot(dx, dy);
}

function broadcastZombieState(
  network: NetworkServerLibrary,
  id: number,
  state: "idle" | "attack",
  position: Position,
  velocity: Velocity,
) {
  sendToInGamePlayers(network, {
    type: "zombieState",
    id,
    state,
    position: { x: position.x, y: position.y },
    velocity: { x: velocity.x, y: velocity.y },
  });
}
