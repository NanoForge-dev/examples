import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { blockPaddles } from "./block-paddles.system";
import { bounceBall } from "./bounce-ball.system";

/**
 * Stops the paddle at the walls (`blockPaddles`) and bounces the ball off the paddle, the walls
 * and the bricks (`bounceBall`), unless the game is paused.
 *
 * @system
 * @side client
 */
export const collide = (registry: Registry, ctx: Context) => {
  if (ctx.scenes.vars.has("paused")) return;
  blockPaddles(registry);
  bounceBall(registry);
};
