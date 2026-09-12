import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { Login } from "../components/login.component";
import { Position } from "../components/position.component";
import { Hitbox } from "../components/hitbox.component";
import { Health } from "../components/health.component";
import { ReviveInput } from "../components/revive-input.component";
import { PlayerClass } from "../components/player-class.component";
import { PLAYER_CLASS_CATALOG } from "../player-class-catalog";
import { distanceBetweenHitboxes } from "./zombie-ai";
import { sendToInGamePlayers } from "../network-utils";

// Same edge-to-edge AABB metric zombie-ai.ts uses for its own attack/aggro ranges - how close a
// reviver's hitbox needs to be to a downed teammate's to start/keep channeling.
export const REVIVE_RANGE = 20;
export const REVIVE_HEALTH_FRACTION = 0.2;

interface PlayerEntity {
  id: number;
  Login: Login;
  Position: Position;
  Hitbox: Hitbox;
  Health: Health;
  ReviveInput: ReviveInput;
  PlayerClass: PlayerClass;
}

// Server-authoritative hold-E-near-a-downed-teammate revive channel. Channel state
// (progressSeconds/targetId) lives on the REVIVER's own ReviveInput, not the downed target's -
// only one reviver's progress ever counts toward a given downed player, and releasing E, moving
// out of range, switching targets, or the reviver's own death all reset it to 0 (per design: an
// interrupted revive starts over from scratch, it doesn't pause/resume).
//
// Registered after weaponSystem/moveInputSystem and before gameOverSystem (server/main.ts) so a
// revive completed this tick is already reflected in Health before gameOverSystem's
// allPlayersDead check runs the same tick.
export function reviveSystem(registry: Registry, ctx: Context) {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  const delta = ctx.app.delta / 1000;

  const players: PlayerEntity[] = registry.getIndexedZipper([
    Login,
    Position,
    Hitbox,
    Health,
    ReviveInput,
    PlayerClass,
  ]);

  for (const reviver of players) {
    const input = reviver.ReviveInput;

    // A downed player can't revive anyone - if they somehow had a channel active when they went
    // down (e.g. a zombie killed them the same tick they were channeling), it's cancelled below
    // exactly like any other interruption.
    const canChannel = reviver.Health.current > 0 && input.held;
    const target = canChannel ? nearestDownedTeammate(players, reviver) : null;

    if (!target) {
      cancelIfActive(network, input);
      continue;
    }

    // The REVIVER's own class sets the channel duration (a healer channels faster) - not the
    // downed target's.
    const durationSeconds =
      PLAYER_CLASS_CATALOG[reviver.PlayerClass.playerClass].reviveDurationSeconds;

    if (input.targetId !== target.id) {
      // Fresh start, or switched to a different downed teammate mid-channel - either way this is
      // a new channel, not a continuation of the old progress.
      input.progressSeconds = 0;
      input.targetId = target.id;
      sendToInGamePlayers(network, {
        type: "revive",
        state: "started",
        targetId: target.id,
        durationSeconds,
      });
      continue;
    }

    input.progressSeconds += delta;
    if (input.progressSeconds < durationSeconds) continue;

    target.Health.current = Math.round(target.Health.max * REVIVE_HEALTH_FRACTION);
    input.progressSeconds = 0;
    input.targetId = null;
    sendToInGamePlayers(network, {
      type: "revive",
      state: "completed",
      targetId: target.id,
      health: target.Health.current,
    });
  }
}

function cancelIfActive(network: NetworkServerLibrary, input: ReviveInput) {
  if (input.targetId === null) return;
  const targetId = input.targetId;
  input.progressSeconds = 0;
  input.targetId = null;
  sendToInGamePlayers(network, { type: "revive", state: "cancelled", targetId });
}

function nearestDownedTeammate(
  players: PlayerEntity[],
  reviver: PlayerEntity,
): PlayerEntity | null {
  let closest: PlayerEntity | null = null;
  let closestDistance = REVIVE_RANGE;

  for (const candidate of players) {
    if (candidate.id === reviver.id) continue;
    if (candidate.Health.current > 0) continue;

    const distance = distanceBetweenHitboxes(
      reviver.Position,
      reviver.Hitbox,
      candidate.Position,
      candidate.Hitbox,
    );
    if (distance <= closestDistance) {
      closest = candidate;
      closestDistance = distance;
    }
  }

  return closest;
}

// * Required to generate code
export default reviveSystem.name;
