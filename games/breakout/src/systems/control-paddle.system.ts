import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { moveControl2D } from "./move-control-2d.system";

/**
 * Moves the paddle with the left and right arrows (`moveControl2D`), unless the game is paused.
 *
 * @system
 * @side client
 */
export const controlPaddle = (registry: Registry, ctx: Context) => {
  if (ctx.scenes.vars.has("paused")) return;
  moveControl2D(registry, ctx);
};
