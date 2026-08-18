import { Vector2d } from "@nanoforge-dev/graphics-2d";

export class PointerComponent {
  name = this.constructor.name;
  position: Vector2d = {x: 0, y: 0};

  constructor(position?: Vector2d) {
    if (position) this.position = position;
  }
}

// * Required to generate code
export default PointerComponent.name;
