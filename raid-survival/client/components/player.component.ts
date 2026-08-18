import { Vector2d } from "@nanoforge-dev/graphics-2d";

export class PlayerComponent {
  name = this.constructor.name;
  target: Vector2d = {x: 0, y: 0};
}

export class LocalPlayerComponent {
  name = this.constructor.name;
}

// * Required to generate code
export default PlayerComponent.name;