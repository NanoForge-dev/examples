import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/network/server";
import { Players } from "@network/protocol/protocol";
import { Position2D } from "../components/position-2d.component";

import { Player } from "../components/player.component";

/**
 * Sends every client where every player is. Add it last.
 *
 * @system
 * @side server
 */
export const sendPlayers = (registry: Registry, ctx: Context) => {
  ctx.network.packets.sendToAll(
    Players,
    registry.getZipper([Player, Position2D]).map(({ Player, Position2D }) => ({
      id: Player.clientId,
      x: Math.round(Position2D.x),
      y: Math.round(Position2D.y),
    })),
  );
};
