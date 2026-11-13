import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { Spin3D } from "../components/spin-3d.component";
import { Transform3D } from "../components/transform-3d.component";

/**
 * Turns every `Spin3D` entity by its speed, for the time elapsed since the last frame.
 *
 * @system
 * @side shared
 */
export const spin3D = (registry: Registry, ctx: Context) => {
  const seconds = ctx.app.delta / 1000;

  registry.getZipper([Spin3D, Transform3D]).forEach(({ Spin3D, Transform3D }) => {
    Transform3D.rotationX = (Transform3D.rotationX + Spin3D.x * seconds) % 360;
    Transform3D.rotationY = (Transform3D.rotationY + Spin3D.y * seconds) % 360;
    Transform3D.rotationZ = (Transform3D.rotationZ + Spin3D.z * seconds) % 360;
  });
};
