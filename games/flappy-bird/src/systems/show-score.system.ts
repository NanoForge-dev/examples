import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/scene";

import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Position2D } from "../components/position-2d.component";
import { ScoreDigit } from "../components/score-digit.component";

/**
 * Shows `score` with the `ScoreDigit` entities: each one gets its digit's image, centered, and
 * the digits the score doesn't need are hidden.
 *
 * @system
 * @side client
 * @vars score
 */
export const showScore = (registry: Registry, ctx: Context) => {
  const digits = String(ctx.scenes.vars.get("score") ?? 0);

  registry
    .getZipper([ScoreDigit, Position2D, DrawableRect2D])
    .forEach(({ ScoreDigit, Position2D, DrawableRect2D }) => {
      const digit = digits[ScoreDigit.index];
      DrawableRect2D.visible = digit !== undefined;
      if (digit === undefined) return;
      DrawableRect2D.image = `/${digit}.png`;
      Position2D.x =
        ScoreDigit.centerX + (ScoreDigit.index - digits.length / 2) * DrawableRect2D.width;
    });
};
