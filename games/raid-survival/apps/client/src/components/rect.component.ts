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

  constructor(parent: Container, options: RectConfig) {
    this.rect = new Rect(options);
    parent.add(this.rect);
  }
}
