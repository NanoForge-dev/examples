import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/graphics-3d";

import { DrawableBox3D } from "../components/drawable-box-3d.component";
import { DrawableSphere3D } from "../components/drawable-sphere-3d.component";
import { Position2D } from "../components/position-2d.component";

type Drawable = DrawableBox3D | DrawableSphere3D;

/** The drawables shown by the last frame. */
let shown = new Set<Drawable>();

/**
 * Draws every entity that has a `Position2D` and a `DrawableBox3D` or `DrawableSphere3D`, where
 * it is on the field. Add it after the systems that move entities.
 *
 * @remarks
 * The mesh of a killed entity, or of a removed drawable, is removed from the scene.
 *
 * @system
 * @side client
 */
export const draw3D = (registry: Registry, ctx: Context) => {
  const scene = ctx.graphics.scene;
  const drawn = new Set<Drawable>();

  registry.getZipper([DrawableBox3D, Position2D]).forEach(({ DrawableBox3D, Position2D }) => {
    DrawableBox3D.draw(scene, Position2D);
    drawn.add(DrawableBox3D);
  });
  registry.getZipper([DrawableSphere3D, Position2D]).forEach(({ DrawableSphere3D, Position2D }) => {
    DrawableSphere3D.draw(scene, Position2D);
    drawn.add(DrawableSphere3D);
  });

  // `killEntity` doesn't call `destroy()`: a drawable no longer in the world loses its mesh here.
  for (const drawable of shown) if (!drawn.has(drawable)) drawable.destroy();
  shown = drawn;
};
