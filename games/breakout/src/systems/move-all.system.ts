import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { move2D } from "./move-2d.system";

/**
 * Moves the paddle and the ball (`move2D`), unless the game is paused.
 *
 * @system
 * @side client
 */
export const moveAll = (registry: Registry, ctx: Context) => {
  if (ctx.scenes.vars.has("paused")) return;
  move2D(registry, ctx);
};
