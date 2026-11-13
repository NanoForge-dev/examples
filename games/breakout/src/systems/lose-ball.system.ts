import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { Ball } from "../components/ball.component";
import { Position2D } from "../components/position-2d.component";

/**
 * Takes a life when the ball falls below the paddle, out of the screen: `holdBall` then puts it
 * back on the paddle.
 *
 * @system
 * @side client
 */
export const loseBall = (registry: Registry, ctx: Context) => {
  const vars = ctx.scenes.vars;
  if (vars.has("paused") || !vars.get("served")) return;

  registry.getZipper([Ball, Position2D]).forEach(({ Position2D }) => {
    if (Position2D.y < 720) return;
    vars.set("lives", (vars.get("lives") ?? 1) - 1);
    vars.set("served", false);
  });
};
