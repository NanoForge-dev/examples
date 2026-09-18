import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { MoveInput } from "../components/move-input.component";
import { Position } from "../components/position.component";
import { Velocity } from "../components/velocity.component";
import { sendToInGamePlayers } from "../network-utils";

// collision-resolve.ts broadcasts the moment an axis becomes newly blocked, but not the reverse:
// an axis that's free again after being blocked. This catches that (and any other drift) by
// comparing against what was last actually sent to clients.
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
