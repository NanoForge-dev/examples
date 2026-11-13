import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/scene";

import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Position2D } from "../components/position-2d.component";
import { ScrollLoop } from "../components/scroll-loop.component";

/**
 * Scrolls the `ScrollLoop` entities (the ground) to the left, until the bird dies.
 *
 * @system
 * @side client
 */
export const scrollGround = (registry: Registry, ctx: Context) => {
  if (ctx.scenes.vars.has("over")) return;
  const seconds = ctx.app.delta / 1000;

  registry
    .getZipper([ScrollLoop, Position2D, DrawableRect2D])
    .forEach(({ ScrollLoop, Position2D, DrawableRect2D }) => {
      Position2D.x -= ScrollLoop.speed * seconds;
      if (Position2D.x <= -DrawableRect2D.width) Position2D.x += ScrollLoop.span;
    });
};
