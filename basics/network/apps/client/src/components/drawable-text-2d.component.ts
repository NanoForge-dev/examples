import { type Layer, Text } from "@nanoforge-dev/graphics-2d";
import type { Position2D } from "./position-2d.component";

/**
 * Draws a text at the entity's `Position2D` (its top-left corner). Needs the `draw2D` system.
 *
 * @remarks
 * Change `text` from a system to show a score, a timer... `shape` is the Konva `Text` on screen:
 * change it from code for anything the parameters don't offer.
 *
 * @component
 * @side client
 * @group Text color=#e86fb0 - What is written.
 * @group Look color=#b18cff - What the text looks like.
 * @group Advanced hidden - Less common settings.
 */
export class DrawableText2D {
  name = "DrawableText2D";

  /** The text on screen, made by `draw2D` the first time it draws it. */
  shape?: Text;

  constructor(
    /** What is written. @group Text */
    public text = "Hello",
    /** Height of the letters, in pixels. @group Text */
    public fontSize = 24,
    /** A CSS color: `white`, `#ffffff`... @group Look @preset color */
    public fillColor = "#ffffff",
    /** From 0 (invisible) to 1 (opaque). @group Look */
    public opacity = 1,
    /** A CSS font family: `Arial`, `monospace`... @group Advanced */
    public fontFamily = "Arial",
    /** Clockwise, in degrees, around the top-left corner. @group Advanced */
    public rotation = 0,
    /** Whether it is drawn. @group Advanced */
    public visible = true,
  ) {}

  /** Puts the text on `layer` at `position`, up to date with the parameters. */
  draw(layer: Layer, position: Position2D): void {
    this.shape ??= new Text();
    if (this.shape.getParent() !== layer) layer.add(this.shape);
    this.shape.setAttrs({
      x: position.x,
      y: position.y,
      text: this.text,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fill: this.fillColor,
      opacity: this.opacity,
      rotation: this.rotation,
      visible: this.visible,
    });
  }

  /** Removes the text from the screen. */
  destroy(): void {
    this.shape?.destroy();
    this.shape = undefined;
  }
}
