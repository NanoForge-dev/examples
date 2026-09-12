import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { MoveInput } from "../components/move-input.component";
import { Position } from "../components/position.component";
import { Velocity } from "../components/velocity.component";
import { sendToInGamePlayers } from "../network-utils";

// Runs last in the tick, after movement and both collision systems have fully resolved this
// frame's Velocity/Position. collision-resolve.ts already broadcasts the moment an axis becomes
// newly blocked, but nothing announces the opposite: an axis that was blocked last tick and is
// free again this tick (move-input.system.ts silently restores it from held-key intent every
// tick, precisely so a wall slide never permanently overrides what's actually still held) -
// clients would otherwise keep dead-reckoning the old, still-zeroed velocity forever. This
// catches that transition, and any other drift, by comparing against what was last actually
// sent - a harmless no-op duplicate on the rare tick collision-resolve.ts also just broadcast.
export function moveSyncSystem(registry: Registry, ctx: Context) {
  const entities: { id: number; MoveInput: MoveInput; Position: Position; Velocity: Velocity }[] =
    registry.getIndexedZipper([MoveInput, Position, Velocity]);
  if (entities.length === 0) return;

  const network = ctx.libs.getNetwork<NetworkServerLibrary>();

  for (const { id, MoveInput: input, Position: position, Velocity: velocity } of entities) {
    if (velocity.x === input.lastBroadcastVelocity.x && velocity.y === input.lastBroadcastVelocity.y) continue;

    input.lastBroadcastVelocity = { x: velocity.x, y: velocity.y };
    sendToInGamePlayers(network, {
      type: "move",
      id,
      velocity: { x: velocity.x, y: velocity.y },
      position: { x: position.x, y: position.y },
    });
  }
}

// * Required to generate code
export default moveSyncSystem.name;
