import type { AssetContext } from "@nanoforge-dev/common";
import { type Layer, Rect } from "@nanoforge-dev/graphics-2d";
import type { Position2D } from "./position-2d.component";

import { imageFill } from "../image-fill";

/**
 * Draws a rectangle at the entity's `Position2D` (its top-left corner). Needs the `draw2D`
 * system.
 *
 * @remarks
 * `shape` is the Konva `Rect` on screen: change it from code for anything the parameters don't
 * offer (shadows, strokes...).
 *
 * @component
 * @side client
 * @group Shape color=#e86fb0 - Size of the rectangle.
 * @group Look color=#b18cff - What the rectangle looks like.
 * @group Advanced hidden - Less common settings.
 */
export class DrawableRect2D {
  name = "DrawableRect2D";

  /** The rectangle on screen, made by `draw2D` the first time it draws it. */
  shape?: Rect;

  constructor(
    /** In pixels. @group Shape @preset size.width */
    public width = 50,
    /** In pixels. @group Shape @preset size.height */
    public height = 50,
    /** A CSS color: `red`, `#ff0000`, `rgba(255, 0, 0, 0.5)`... @group Look @preset color */
    public fillColor = "#4aa3ff",
    /** An image stretched over the rectangle, shown instead of the color. @group Look @asset .png .jpg .jpeg .gif .webp .svg */
    public image = "",
    /** From 0 (invisible) to 1 (opaque). @group Look */
    public opacity = 1,
    /** Clockwise, in degrees, around the top-left corner. @group Advanced */
    public rotation = 0,
    /** Rounds the corners, in pixels. @group Advanced */
    public cornerRadius = 0,
    /** Whether it is drawn. @group Advanced */
    public visible = true,
  ) {}

  /** Puts the rectangle on `layer` at `position`, up to date with the parameters. */
  draw(layer: Layer, position: Position2D, assets: AssetContext): void {
    this.shape ??= new Rect();
    if (this.shape.getParent() !== layer) layer.add(this.shape);
    this.shape.setAttrs({
      x: position.x,
      y: position.y,
      width: this.width,
      height: this.height,
      fill: this.fillColor,
      opacity: this.opacity,
      rotation: this.rotation,
      cornerRadius: this.cornerRadius,
      visible: this.visible,
      ...imageFill(assets, this.image, this.width, this.height),
    });
  }

  /** Removes the rectangle from the screen. */
  destroy(): void {
    this.shape?.destroy();
    this.shape = undefined;
  }
}
