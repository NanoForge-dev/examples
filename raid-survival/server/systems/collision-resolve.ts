import { type Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { Position } from "../components/position.component";
import { Velocity } from "../components/velocity.component";
import { sendToInGamePlayers } from "../network-utils";

// Shared by every server-side collision system (map trees, the lobby structure, ...): resolves
// a moving entity's overlap with a static obstacle by reverting just the axis (or axes) that
// caused it - so it keeps sliding along the other axis instead of hard-stopping - then
// broadcasts the corrected position/velocity. `isBlocked` tests whether a given (x, y) overlaps
// the obstacle.
export function resolveCollision(
  ctx: Context,
  entityId: number,
  position: Position,
  velocity: Velocity,
  delta: number,
  isBlocked: (x: number, y: number) => boolean,
): void {
  const prevX = position.x - velocity.x * delta;
  const prevY = position.y - velocity.y * delta;

  if (!isBlocked(position.x, prevY)) {
    // Only the Y movement caused the overlap - stop on Y, keep sliding along X.
    position.y = prevY;
    velocity.y = 0;
  } else if (!isBlocked(prevX, position.y)) {
    // Only the X movement caused the overlap - stop on X, keep sliding along Y.
    position.x = prevX;
    velocity.x = 0;
  } else {
    // Both axes overlap on their own (e.g. moving straight into a corner) - stop fully.
    position.x = prevX;
    position.y = prevY;
    velocity.x = 0;
    velocity.y = 0;
  }

  sendToInGamePlayers(ctx.libs.getNetwork<NetworkServerLibrary>(), {
    type: "move",
    id: entityId,
    velocity: { x: velocity.x, y: velocity.y },
    position: { x: position.x, y: position.y },
  });
}
