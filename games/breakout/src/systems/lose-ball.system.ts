import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { Ball } from "../components/ball.component";
import { Position2D } from "../components/position-2d.component";

/**
 * Takes a life when the ball falls below the paddle, out of the screen: `holdBall` then puts it
 * back on the paddle.
 *
 * @remarks
 * A ball out through the top or a side is put back on the paddle too, without taking a life: a
 * long frame (a hidden tab) can move it past a wall without touching it.
 *
 * @system
 * @side client
 */
export const loseBall = (registry: Registry, ctx: Context) => {
  const vars = ctx.scenes.vars;
  if (vars.has("paused") || !vars.get("served")) return;

  registry.getZipper([Ball, Position2D]).forEach(({ Position2D }) => {
    const { x, y } = Position2D;
    if (y >= 720) vars.set("lives", (vars.get("lives") ?? 1) - 1);
    else if (y >= 0 && x >= 0 && x <= 1280) return;
    vars.set("served", false);
  });
};
