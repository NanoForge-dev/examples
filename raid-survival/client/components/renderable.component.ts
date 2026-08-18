import { Sprite, Vector2d } from "@nanoforge-dev/graphics-2d";

interface RenderableComponentOptions {
  animationsKey?: string;
  scale?: Vector2d;
}

export class RenderableComponent {
  name = this.constructor.name;
  spriteKey: string;
  animationsKey?: string;
  sprite: Sprite | undefined;
  scale: Vector2d = { x: 1, y: 1 };

  constructor(spriteKey: string, options?: RenderableComponentOptions) {
    this.spriteKey = spriteKey;
    if (options?.animationsKey) this.animationsKey = options.animationsKey;
    if (options?.scale) this.scale = options.scale;
  }
}

// * Required to generate code
export default RenderableComponent.name;