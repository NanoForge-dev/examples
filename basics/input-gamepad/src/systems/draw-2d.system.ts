import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/graphics-2d";
import { Position2D } from "../components/position-2d.component";

import { DrawableCircle2D } from "../components/drawable-circle-2d.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { DrawableText2D } from "../components/drawable-text-2d.component";

type Drawable = DrawableRect2D | DrawableCircle2D | DrawableText2D;

/** The drawables shown by the last frame. */
let shown = new Set<Drawable>();

/**
 * Draws every entity that has a `Position2D` and a `DrawableRect2D`, `DrawableCircle2D` or
 * `DrawableText2D`, where it is. Add it last, after the systems that move entities.
 *
 * @remarks
 * The shape of a killed entity, or of a removed drawable, is removed from the screen.
 *
 * @system
 * @side client
 */
export const draw2D = (registry: Registry, ctx: Context) => {
  const layer = ctx.graphics.baseLayer;
  const drawn = new Set<Drawable>();

  registry.getZipper([DrawableRect2D, Position2D]).forEach(({ DrawableRect2D, Position2D }) => {
    DrawableRect2D.draw(layer, Position2D, ctx.assets);
    drawn.add(DrawableRect2D);
  });
  registry.getZipper([DrawableCircle2D, Position2D]).forEach(({ DrawableCircle2D, Position2D }) => {
    DrawableCircle2D.draw(layer, Position2D, ctx.assets);
    drawn.add(DrawableCircle2D);
  });
  registry.getZipper([DrawableText2D, Position2D]).forEach(({ DrawableText2D, Position2D }) => {
    DrawableText2D.draw(layer, Position2D);
    drawn.add(DrawableText2D);
  });

  // `killEntity` doesn't call `destroy()`: a drawable no longer in the world loses its shape here.
  for (const drawable of shown) if (!drawn.has(drawable)) drawable.destroy();
  shown = drawn;
};
