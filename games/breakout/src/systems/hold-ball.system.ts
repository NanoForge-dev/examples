import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { InputEnum } from "@nanoforge-dev/input";

import { Ball } from "../components/ball.component";
import { HitboxRect2D } from "../components/hitbox-rect-2d.component";
import { Paddle } from "../components/paddle.component";
import { Position2D } from "../components/position-2d.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { justPressed } from "../keys";

/** The angle of a serve, from vertical. */
const SERVE_ANGLE = (30 * Math.PI) / 180;

/**
 * Keeps the ball on the paddle until Space serves it, at the level's `ballSpeed`.
 *
 * @system
 * @side client
 */
export const holdBall = (registry: Registry, ctx: Context) => {
  const vars = ctx.scenes.vars;
  if (vars.has("paused") || vars.get("served")) return;
  const paddle = registry.getZipper([Paddle, Position2D, HitboxRect2D])[0];
  if (!paddle) return;

  registry
    .getZipper([Ball, Position2D, Velocity2D, HitboxRect2D])
    .forEach(({ Position2D: ball, Velocity2D: velocity, HitboxRect2D: box }) => {
      ball.x = paddle.Position2D.x + (paddle.HitboxRect2D.width - box.width) / 2;
      ball.y = paddle.Position2D.y - box.height - 2;
      velocity.x = 0;
      velocity.y = 0;
      if (!justPressed(ctx, InputEnum.Space)) return;
      const speed = vars.get("ballSpeed") ?? 450;
      vars.set("served", true);
      velocity.x = speed * Math.sin(SERVE_ANGLE);
      velocity.y = -speed * Math.cos(SERVE_ANGLE);
    });
};
