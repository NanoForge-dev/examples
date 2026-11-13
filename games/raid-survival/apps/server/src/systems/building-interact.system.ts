import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";
import {
  TOWER_HEAL_COST,
  TOWER_HP_PER_LEVEL,
  TOWER_MAX_LEVEL,
  TOWER_UPGRADE_COST,
  LOBBY_HEAL_COST_PER_HP,
  WALL_HEAL_COST_PER_HP,
} from "@raid-survival/shared/tower";

import { Login } from "../components/login.component";
import { Position2D } from "../components/position-2d.component";
import { Hitbox } from "../components/hitbox.component";
import { Health } from "../components/health.component";
import { ReviveInput } from "../components/revive-input.component";
import { Building } from "../components/building.component";
import { Tower } from "../components/tower.component";
import { Lobby } from "../components/lobby.component";
import { Money } from "../components/money.component";
import { distanceBetweenHitboxes } from "../zombie-ai";
import { broadcast } from "../broadcast";

const INTERACT_RANGE = 20;

interface Candidate {
  id: number;
  position: Position2D;
  hitbox: Hitbox;
  health: Health;
  // Present only for a tower - selects the upgrade branch vs. a wall/lobby's heal-only branch.
  tower: Tower | undefined;
  healCostPerHp: number;
}

/**
 * Instant E-press interaction: heal a damaged building/lobby to full, or (a tower already at
 * full HP) spend money to upgrade it one level - never both from the same press. Reuses
 * ReviveInput's `interactRequested` one-shot, the same E key as the hold-to-revive channel.
 *
 * @system
 * @side server
 */
export const buildingInteractSystem = (registry: Registry, ctx: Context) => {
  const players: {
    id: number;
    Login: Login;
    Position2D: Position2D;
    Hitbox: Hitbox;
    Health: Health;
    ReviveInput: ReviveInput;
  }[] = registry.getIndexedZipper([Login, Position2D, Hitbox, Health, ReviveInput]);
  if (players.length === 0) return;

  const buildings: {
    id: number;
    Building: Building;
    Position2D: Position2D;
    Hitbox: Hitbox;
    Health: Health;
  }[] = registry.getIndexedZipper([Building, Position2D, Hitbox, Health]);
  const lobbies: { id: number; Position2D: Position2D; Hitbox: Hitbox; Health: Health }[] =
    registry.getIndexedZipper([Lobby, Position2D, Hitbox, Health]);

  const candidates: Candidate[] = [
    ...buildings.map((b) => ({
      id: b.id,
      position: b.Position2D,
      hitbox: b.Hitbox,
      health: b.Health,
      tower: registry.getEntityComponent(registry.entityFromIndex(b.id), Tower) ?? undefined,
      healCostPerHp: WALL_HEAL_COST_PER_HP,
    })),
    ...lobbies.map((l) => ({
      id: l.id,
      position: l.Position2D,
      hitbox: l.Hitbox,
      health: l.Health,
      tower: undefined,
      healCostPerHp: LOBBY_HEAL_COST_PER_HP,
    })),
  ];

  const moneyEntities: { Money: Money }[] = registry.getZipper([Money]);
  const money = moneyEntities[0]?.Money;

  for (const player of players) {
    const input = player.ReviveInput;
    if (!input.interactRequested) continue;
    // One-shot flag, cleared regardless of outcome.
    input.interactRequested = false;

    if (player.Health.current <= 0) continue; // a downed player can't interact with anything
    // An active revive channel (same E key, held) claims this press instead - see
    // revive.system.ts, registered before this system.
    if (input.targetId !== null) continue;
    if (!money) continue;

    let nearest: Candidate | null = null;
    let nearestDistance = INTERACT_RANGE;
    for (const candidate of candidates) {
      const distance = distanceBetweenHitboxes(
        player.Position2D,
        player.Hitbox,
        candidate.position,
        candidate.hitbox,
      );
      if (distance <= nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    }
    if (!nearest) continue;

    if (nearest.tower) {
      if (nearest.health.current < nearest.health.max) {
        if (money.amount < TOWER_HEAL_COST) continue;
        money.amount -= TOWER_HEAL_COST;
        nearest.health.current = nearest.health.max;
      } else if (nearest.tower.level < TOWER_MAX_LEVEL) {
        if (money.amount < TOWER_UPGRADE_COST) continue;
        money.amount -= TOWER_UPGRADE_COST;
        nearest.tower.level += 1;
        nearest.health.max += TOWER_HP_PER_LEVEL;
        nearest.health.current = nearest.health.max;
      } else {
        continue; // already max level and already at full HP - nothing to do
      }

      broadcast(ctx, {
        type: "towerUpdate",
        id: nearest.id,
        level: nearest.tower.level,
        health: { current: nearest.health.current, max: nearest.health.max },
      });
    } else {
      // Wall/lobby: heal-only, no levels.
      if (nearest.health.current >= nearest.health.max) continue; // nothing to repair
      const missing = nearest.health.max - nearest.health.current;
      const cost = Math.ceil(missing * nearest.healCostPerHp);
      if (money.amount < cost) continue;
      money.amount -= cost;
      nearest.health.current = nearest.health.max;

      broadcast(ctx, {
        type: "heal",
        id: nearest.id,
        health: { current: nearest.health.current, max: nearest.health.max },
      });
    }

    broadcast(ctx, { type: "money", amount: money.amount });
  }
};
