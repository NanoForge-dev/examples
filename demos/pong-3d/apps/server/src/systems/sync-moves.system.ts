import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { NetworkId } from "../components/network-id.component";
import { Position2D } from "../components/position-2d.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { Move } from "../protocol";

/**
 * Sends a `Move` to every client for each `NetworkId` entity whose velocity changed: the clients
 * move it the same way until the next one. Add it last.
 *
 * @system
 * @side server
 */
export const syncMoves = (registry: Registry, ctx: Context) => {
  registry
    .getZipper([NetworkId, Position2D, Velocity2D])
    .forEach(({ NetworkId: sync, Position2D: position, Velocity2D: velocity }) => {
      if (velocity.x === sync.sentX && velocity.y === sync.sentY) return;
      ctx.network.packets.sendToAll(Move, {
        id: sync.id,
        position: { x: position.x, y: position.y },
        velocity: { x: velocity.x, y: velocity.y },
      });
      sync.sentX = velocity.x;
      sync.sentY = velocity.y;
    });
};
