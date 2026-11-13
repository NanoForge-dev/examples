import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/network/server";
import { ARENA, Join, PLAYER_SIZE } from "@network/protocol/messages";
import { Position2D } from "../components/position-2d.component";
import { Velocity2D } from "../components/velocity-2d.component";

import { Player } from "../components/player.component";

/**
 * Spawns a player in the middle of the arena for each client that joins, once per client, and
 * kills the players of the clients that left.
 *
 * @system
 * @side server
 */
export const joinPlayers = (registry: Registry, ctx: Context) => {
  const players = registry.getIndexedZipper([Player]);
  const joins = ctx.network.packets.read(Join);

  if (joins.length) {
    // A client gets one player, whatever it sends: several joins in one tick spawn one player.
    const joined = new Set(players.map(({ Player }) => Player.clientId));
    for (const { clientId } of joins) {
      if (joined.has(clientId)) continue;
      joined.add(clientId);
      const player = registry.spawnEntity();
      registry.addComponent(player, new Player(clientId));
      registry.addComponent(
        player,
        new Position2D((ARENA.width - PLAYER_SIZE) / 2, (ARENA.height - PLAYER_SIZE) / 2),
      );
      registry.addComponent(player, new Velocity2D(0, 0));
    }
  }
  for (const { id: index, Player } of players)
    if (!ctx.network.clients.get(Player.clientId))
      registry.killEntity(registry.entityFromIndex(index));
};
