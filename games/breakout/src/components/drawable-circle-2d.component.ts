import type { AssetContext } from "@nanoforge-dev/common";
import { Circle, type Layer } from "@nanoforge-dev/graphics-2d";
import type { Position2D } from "./position-2d.component";

import { imageFill } from "../image-fill";

/**
 * Draws a circle at the entity's `Position2D` (its center). Needs the `draw2D` system.
 *
 * @remarks
 * `shape` is the Konva `Circle` on screen: change it from code for anything the parameters don't
 * offer (shadows, strokes...).
 *
 * @component
 * @side client
 * @group Shape color=#e86fb0 - Size of the circle.
 * @group Look color=#b18cff - What the circle looks like.
 * @group Advanced hidden - Less common settings.
 */
export class DrawableCircle2D {
  name = "DrawableCircle2D";

  /** The circle on screen, made by `draw2D` the first time it draws it. */
  shape?: Circle;

  constructor(
    /** In pixels. @group Shape */
    public radius = 25,
    /** A CSS color: `red`, `#ff0000`, `rgba(255, 0, 0, 0.5)`... @group Look @preset color */
    public fillColor = "#4aa3ff",
    /** An image stretched over the circle, shown instead of the color. @group Look @asset .png .jpg .jpeg .gif .webp .svg */
    public image = "",
    /** From 0 (invisible) to 1 (opaque). @group Look */
    public opacity = 1,
    /** Clockwise, in degrees, around the center. @group Advanced */
    public rotation = 0,
    /** Whether it is drawn. @group Advanced */
    public visible = true,
  ) {}

  /** Puts the circle on `layer` at `position`, up to date with the parameters. */
  draw(layer: Layer, position: Position2D, assets: AssetContext): void {
    this.shape ??= new Circle();
    if (this.shape.getParent() !== layer) layer.add(this.shape);
    this.shape.setAttrs({
      x: position.x,
      y: position.y,
      radius: this.radius,
      fill: this.fillColor,
      opacity: this.opacity,
      rotation: this.rotation,
      visible: this.visible,
      ...imageFill(assets, this.image, this.radius * 2, this.radius * 2, true),
    });
  }

  /** Removes the circle from the screen. */
  destroy(): void {
    this.shape?.destroy();
    this.shape = undefined;
  }
}
