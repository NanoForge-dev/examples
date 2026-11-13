import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/scene";
import "@nanoforge-dev/sound";

import { Bird } from "../components/bird.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Pipe } from "../components/pipe.component";
import { Position2D } from "../components/position-2d.component";

/**
 * Adds a point to `score` for each pair of pipes the bird flies past.
 *
 * @system
 * @side client
 * @vars score
 */
export const scorePipes = (registry: Registry, ctx: Context) => {
  const vars = ctx.scenes.vars;
  const pipes = registry.getZipper([Pipe, Position2D, DrawableRect2D]);

  registry.getZipper([Bird, Position2D]).forEach(({ Bird, Position2D: bird }) => {
    if (Bird.dead) return;
    for (const { Pipe, Position2D, DrawableRect2D } of pipes) {
      const right = Position2D.x + DrawableRect2D.width;
      // A pipe waiting off the screen (`right < 0`) was never flown past.
      if (Pipe.top || Pipe.scored || right >= bird.x || right < 0) continue;
      Pipe.scored = true;
      vars.set("score", (vars.get("score") ?? 0) + 1);
      ctx.sound.play("point");
    }
  });
};
