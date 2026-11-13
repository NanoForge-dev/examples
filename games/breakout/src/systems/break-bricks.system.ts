import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { Brick } from "../components/brick.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Wall } from "../components/wall.component";

/**
 * Takes a hit from each brick the ball bounced off. A hit brick fades; a broken one disappears,
 * stops the ball no more, adds its points to `score` and takes one from `bricksLeft`.
 *
 * @system
 * @side client
 */
export const breakBricks = (registry: Registry, ctx: Context) => {
  const vars = ctx.scenes.vars;

  registry
    .getIndexedZipper([Brick, Wall, DrawableRect2D])
    .forEach(({ id, Brick: brick, Wall: wall, DrawableRect2D: look }) => {
      if (wall.hits === 0) return;
      brick.hits -= wall.hits;
      wall.hits = 0;
      if (brick.hits > 0) {
        look.opacity = 0.55;
        return;
      }
      look.visible = false;
      registry.removeComponent(registry.entityFromIndex(id), Wall);
      vars.set("score", (vars.get("score") ?? 0) + brick.points);
      vars.set("bricksLeft", (vars.get("bricksLeft") ?? 1) - 1);
    });
};
