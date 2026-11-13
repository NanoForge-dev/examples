import type { Registry } from "@nanoforge-dev/ecs";

import { DrawableBox3D } from "../components/drawable-box-3d.component";
import { DrawableSphere3D } from "../components/drawable-sphere-3d.component";
import { Position2D } from "../components/position-2d.component";
import { Transform3D } from "../components/transform-3d.component";
import { FIELD, SCALE } from "../field";

/**
 * Places each drawable on the field: its `Transform3D` follows its `Position2D` (the top-left
 * corner of its shape on the 2D field, in field units), with the shape resting on the ground.
 * Add it after the systems that move entities, before `draw3D`.
 *
 * @system
 * @side client
 */
export const placeOnField = (registry: Registry) => {
  registry
    .getZipper([Position2D, Transform3D, DrawableBox3D])
    .forEach(({ Position2D: at, Transform3D: transform, DrawableBox3D: box }) => {
      transform.x = (at.x - FIELD.width / 2) * SCALE + box.width / 2;
      transform.y = box.height / 2;
      transform.z = (at.y - FIELD.height / 2) * SCALE + box.depth / 2;
    });
  registry
    .getZipper([Position2D, Transform3D, DrawableSphere3D])
    .forEach(({ Position2D: at, Transform3D: transform, DrawableSphere3D: ball }) => {
      transform.x = (at.x - FIELD.width / 2) * SCALE + ball.radius;
      transform.y = ball.radius;
      transform.z = (at.y - FIELD.height / 2) * SCALE + ball.radius;
    });
};
