import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/network/server";
import { Move, PLAYER_SPEED } from "@network/protocol/protocol";
import { Velocity2D } from "../components/velocity-2d.component";

import { Player } from "../components/player.component";

/**
 * Sets the `Velocity2D` of each player from the last direction its client sent. The client only
 * says where it wants to go: the speed is the server's. Add it before `move2D`.
 *
 * @system
 * @side server
 */
export const steerPlayers = (registry: Registry, ctx: Context) => {
  const moves = ctx.network.packets.read(Move);
  if (!moves.length) return;

  registry.getZipper([Player, Velocity2D]).forEach(({ Player, Velocity2D }) => {
    const move = moves.findLast(({ clientId }) => clientId === Player.clientId);
    if (!move) return;
    Velocity2D.x = move.data.x * PLAYER_SPEED;
    Velocity2D.y = move.data.y * PLAYER_SPEED;
  });
};
