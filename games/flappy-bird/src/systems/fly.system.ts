import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { Bird } from "../components/bird.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Position2D } from "../components/position-2d.component";
import { Velocity2D } from "../components/velocity-2d.component";

/** The longest step, in seconds: a slow frame doesn't throw the bird through a pipe. */
const MAX_STEP = 1 / 30;

/**
 * Makes the bird fall, keeps it under the sky, and tilts it with its speed: nose up when it
 * flaps, nose down when it falls.
 *
 * @system
 * @side client
 */
export const fly = (registry: Registry, ctx: Context) => {
  const seconds = Math.min(ctx.app.delta / 1000, MAX_STEP);

  registry
    .getZipper([Bird, Position2D, Velocity2D, DrawableRect2D])
    .forEach(({ Bird, Position2D, Velocity2D, DrawableRect2D }) => {
      if (Bird.dead) return;
      Velocity2D.y = Math.min(Velocity2D.y + Bird.gravity * seconds, Bird.maxFallSpeed);
      Position2D.y += Velocity2D.y * seconds;

      const top = Position2D.y - DrawableRect2D.height / 2;
      if (top < 0) {
        Position2D.y -= top;
        Velocity2D.y = Math.max(0, Velocity2D.y);
      }

      DrawableRect2D.rotation = Math.max(-25, Math.min(90, Velocity2D.y / 8));
      // `draw2D` turns a shape around its top-left corner and never sets its offset: turn the
      // bird around its center, which is its `Position2D`.
      DrawableRect2D.shape?.offset({ x: DrawableRect2D.width / 2, y: DrawableRect2D.height / 2 });
    });
};
