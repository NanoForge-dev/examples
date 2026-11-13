import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { ARENA, PLAYER_SIZE } from "@network/protocol/protocol";
import { Position2D } from "../components/position-2d.component";

import { Player } from "../components/player.component";

/**
 * Keeps every player's square inside the arena. Add it after `move2D`.
 *
 * @system
 * @side server
 */
export const keepInArena = (registry: Registry, _ctx: Context) => {
  registry.getZipper([Player, Position2D]).forEach(({ Position2D }) => {
    Position2D.x = Math.min(Math.max(Position2D.x, 0), ARENA.width - PLAYER_SIZE);
    Position2D.y = Math.min(Math.max(Position2D.y, 0), ARENA.height - PLAYER_SIZE);
  });
};
