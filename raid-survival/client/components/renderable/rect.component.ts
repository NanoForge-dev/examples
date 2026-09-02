import { Container, Rect, RectConfig } from "@nanoforge-dev/graphics-2d";
import { SpriteComponent } from "./sprite.component";

export class RectComponent {
  name = this.constructor.name;
  rect: Rect;

  constructor(parent: Container, options: RectConfig) {
    this.rect = new Rect(options);
    parent.add(this.rect);
  }
}

// * Required to generate code
export default SpriteComponent.name;