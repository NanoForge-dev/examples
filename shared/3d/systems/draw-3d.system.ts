import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/graphics-3d";

import { DrawableBox3D } from "../components/drawable-box-3d.component";
import { DrawableSphere3D } from "../components/drawable-sphere-3d.component";
import { Transform3D } from "../components/transform-3d.component";

type Drawable = DrawableBox3D | DrawableSphere3D;

/** The drawables shown by the last frame. */
let shown = new Set<Drawable>();

/**
 * Puts every entity that has a `Transform3D` and a `DrawableBox3D` or `DrawableSphere3D` in the
 * 3D scene, where it is. Add it after the systems that move entities: graphics-3d renders the
 * scene after the systems.
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

  registry.getZipper([DrawableBox3D, Transform3D]).forEach(({ DrawableBox3D, Transform3D }) => {
    DrawableBox3D.draw(scene, Transform3D);
    drawn.add(DrawableBox3D);
  });
  registry
    .getZipper([DrawableSphere3D, Transform3D])
    .forEach(({ DrawableSphere3D, Transform3D }) => {
      DrawableSphere3D.draw(scene, Transform3D);
      drawn.add(DrawableSphere3D);
    });

  // `killEntity` doesn't call `destroy()`: a drawable no longer in the world loses its mesh here.
  for (const drawable of shown) if (!drawn.has(drawable)) drawable.destroy();
  shown = drawn;
};
