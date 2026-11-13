import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { CenterText2D } from "../components/center-text-2d.component";
import { DrawableText2D } from "../components/drawable-text-2d.component";

/**
 * Centers the text of `CenterText2D` entities on their `Position2D`.
 *
 * @remarks
 * `draw2D` never sets a shape's offset: the offset set here stays, and follows the text's size.
 *
 * @system
 * @side client
 */
export const centerText2D = (registry: Registry, _ctx: Context) => {
  registry.getZipper([CenterText2D, DrawableText2D]).forEach(({ DrawableText2D }) => {
    const shape = DrawableText2D.shape;
    shape?.offset({ x: shape.width() / 2, y: shape.height() / 2 });
  });
};
