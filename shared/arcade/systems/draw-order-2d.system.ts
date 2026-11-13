import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/graphics-2d";

import { DrawOrder2D } from "../components/draw-order-2d.component";
import { DrawableCircle2D } from "../components/drawable-circle-2d.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { DrawableText2D } from "../components/drawable-text-2d.component";

type Stacked = { order: DrawOrder2D; drawable: DrawableRect2D | DrawableCircle2D | DrawableText2D };

/** The number of shapes on the layer the last time it was stacked. */
let stackedShapes = -1;

/**
 * Stacks the shapes of `DrawOrder2D` entities by their `z`, over the other shapes. Add it right
 * after `draw2D`.
 *
 * @remarks
 * It only stacks again when a shape appeared or went away, or a `z` changed.
 *
 * @system
 * @side client
 */
export const drawOrder2D = (registry: Registry, ctx: Context) => {
  const layer = ctx.graphics.baseLayer;
  const rects = registry.getZipper([DrawOrder2D, DrawableRect2D]);
  const circles = registry.getZipper([DrawOrder2D, DrawableCircle2D]);
  const texts = registry.getZipper([DrawOrder2D, DrawableText2D]);
  const moved = ({ DrawOrder2D }: { DrawOrder2D: DrawOrder2D }) =>
    DrawOrder2D.stackedZ !== DrawOrder2D.z;
  const changed =
    layer.children.length !== stackedShapes ||
    rects.some(moved) ||
    circles.some(moved) ||
    texts.some(moved);
  if (!changed) return;

  const rows: Stacked[] = [
    ...rects.map(({ DrawOrder2D, DrawableRect2D }) => ({
      order: DrawOrder2D,
      drawable: DrawableRect2D,
    })),
    ...circles.map(({ DrawOrder2D, DrawableCircle2D }) => ({
      order: DrawOrder2D,
      drawable: DrawableCircle2D,
    })),
    ...texts.map(({ DrawOrder2D, DrawableText2D }) => ({
      order: DrawOrder2D,
      drawable: DrawableText2D,
    })),
  ];
  // A stable sort keeps the entity order between equal `z`.
  for (const { order, drawable } of rows.sort((a, b) => a.order.z - b.order.z)) {
    drawable.shape?.moveToTop();
    order.stackedZ = order.z;
  }
  stackedShapes = layer.children.length;
};
