import { Container, Rect, RectConfig } from "@nanoforge-dev/graphics-2d";

/**
 * A Konva rectangle added to a parent node.
 *
 * @component
 * @side client
 */
export class RectComponent {
  name = "RectComponent";
  rect: Rect;

  constructor(
    /** The node the rectangle is added to. */
    parent: Container,
    /** Konva options of the rectangle. */
    options: RectConfig,
  ) {
    this.rect = new Rect(options);
    parent.add(this.rect);
  }
}
