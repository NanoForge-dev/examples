import { Sprite, Vector2d } from "@nanoforge-dev/graphics-2d";

interface RenderableComponentOptions {
  animationsKey?: string;
  scale?: Vector2d;
  currentAnimation?: string;
}

export class RenderableComponent {
  name = this.constructor.name;
  spriteKey: string;
  sprite: Sprite | undefined;
  animationsKey?: string;

  private _scale: Vector2d = { x: 1, y: 1 };
  private _currentAnimation: string = "idle";
  private _flipped: boolean = false;

  constructor(spriteKey: string, options?: RenderableComponentOptions) {
    this.spriteKey = spriteKey;
    if (options?.animationsKey) this.animationsKey = options.animationsKey;
    if (options?.scale) this._scale = options.scale;
    if (options?.currentAnimation) this._currentAnimation = options.currentAnimation;
  }

  getAnimation(): string {
    return this._currentAnimation;
  }

  setAnimation(animation: string) {
    if (animation === this._currentAnimation) return;
    this._currentAnimation = animation;
    this.sprite?.animation(animation);
  }

  getScale(): Vector2d {
    return this._scale;
  }

  setScale(scale: Vector2d) {
    this._scale = scale;
    this.sprite?.scale(scale);
  }

  isFlipped() {
    return this._flipped;
  }

  flip() {
    this._flipped = true;
    this.sprite?.scaleX(this._scale.x * -1)
  }

  unflip() {
    this._flipped = false;
    this.sprite?.scaleX(this._scale.x);
  }
}

// * Required to generate code
export default RenderableComponent.name;