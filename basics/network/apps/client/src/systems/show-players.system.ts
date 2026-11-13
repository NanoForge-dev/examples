import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/network/client";
import { PLAYER_SIZE, Players } from "@network/protocol/protocol";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Position2D } from "../components/position-2d.component";

import { NetworkPlayer } from "../components/network-player.component";

/**
 * Shows the players the server sent last: moves their squares, spawns the squares of new players
 * (green for this client's, red for the others) and kills those of the players that left. Add it
 * before `draw2D`.
 *
 * @system
 * @side client
 */
export const showPlayers = (registry: Registry, ctx: Context) => {
  const players = ctx.network.packets.read(Players).at(-1)?.data;
  if (!players) return;

  const shown = registry.getIndexedZipper([NetworkPlayer, Position2D]);
  for (const { id: index, NetworkPlayer, Position2D } of shown) {
    const player = players.find(({ id }) => id === NetworkPlayer.clientId);
    if (!player) {
      registry.killEntity(registry.entityFromIndex(index));
      continue;
    }
    Position2D.x = player.x;
    Position2D.y = player.y;
  }
  for (const { id, x, y } of players) {
    if (shown.some(({ NetworkPlayer }) => NetworkPlayer.clientId === id)) continue;
    const color = id === ctx.network.clientId ? "#a6e3a1" : "#f38ba8";
    const player = registry.spawnEntity();
    registry.addComponent(player, new NetworkPlayer(id));
    registry.addComponent(player, new Position2D(x, y));
    registry.addComponent(player, new DrawableRect2D(PLAYER_SIZE, PLAYER_SIZE, color));
  }
};
