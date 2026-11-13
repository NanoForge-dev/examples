import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { NetworkId } from "../components/network-id.component";
import { Position2D } from "../components/position-2d.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { Move } from "../pong-protocol";

/**
 * Applies the server's `Move` packets to the `NetworkId` entities: `move2D` moves them the same
 * way until the next one. Add it before `move2D`.
 *
 * @system
 * @side client
 */
export const applyMoves = (registry: Registry, ctx: Context) => {
  const entities = registry.getZipper([NetworkId, Position2D, Velocity2D]);

  for (const { data } of ctx.network.packets.read(Move)) {
    const entity = entities.find(({ NetworkId }) => NetworkId.id === data.id);
    if (!entity) continue;
    entity.Position2D.x = data.position.x;
    entity.Position2D.y = data.position.y;
    entity.Velocity2D.x = data.velocity.x;
    entity.Velocity2D.y = data.velocity.y;
  }
};
