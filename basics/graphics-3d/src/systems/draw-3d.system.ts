import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/graphics-3d";
import { Transform3D } from "../components/transform-3d.component";

import { Box3D } from "../components/box-3d.component";

/** The boxes shown by the last frame. */
let shown = new Set<Box3D>();

/**
 * Puts every entity that has a `Transform3D` and a `Box3D` in the 3D scene, where it is. Add it
 * last: graphics-3d renders the scene after the systems.
 *
 * @remarks
 * The box of a killed entity, or of a removed `Box3D`, is removed from the scene.
 *
 * @system
 * @side client
 */
export const draw3D = (registry: Registry, ctx: Context) => {
  const drawn = new Set<Box3D>();

  registry.getZipper([Box3D, Transform3D]).forEach(({ Box3D, Transform3D }) => {
    Box3D.draw(ctx.graphics.scene, Transform3D);
    drawn.add(Box3D);
  });

  for (const box of shown) if (!drawn.has(box)) box.destroy();
  shown = drawn;
};
