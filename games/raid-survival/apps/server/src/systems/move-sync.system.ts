import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";

import { MoveInput } from "../components/move-input.component";
import { Position2D } from "../components/position-2d.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { broadcast } from "../broadcast";

/**
 * collision-resolve.ts broadcasts the moment an axis becomes newly blocked, but not the reverse:
 * an axis that's free again after being blocked. This catches that (and any other drift) by
 * comparing against what was last actually sent to clients.
 *
 * @system
 * @side server
 */
export const moveSyncSystem = (registry: Registry, ctx: Context) => {
  const entities: { id: number; MoveInput: MoveInput; Position2D: Position2D; Velocity2D: Velocity2D }[] =
    registry.getIndexedZipper([MoveInput, Position2D, Velocity2D]);
  if (entities.length === 0) return;

  for (const { id, MoveInput: input, Position2D: position, Velocity2D: velocity } of entities) {
    if (velocity.x === input.lastBroadcastVelocity.x && velocity.y === input.lastBroadcastVelocity.y) continue;

    input.lastBroadcastVelocity = { x: velocity.x, y: velocity.y };
    broadcast(ctx, {
      type: "move",
      id,
      velocity: { x: velocity.x, y: velocity.y },
      position: { x: position.x, y: position.y },
    });
  }
};
