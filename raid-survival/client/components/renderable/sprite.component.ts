import { Layer, Sprite, Vector2d } from "@nanoforge-dev/graphics-2d";

interface SpriteComponentOptions {
  animationsKey?: string;
  layer?: Layer;
  scale?: Vector2d;
  currentAnimation?: string;
}

export class SpriteComponent {
  name = this.constructor.name;
  spriteKey: string;
  sprite: Sprite | undefined;
  animationsKey?: string;
  layer: Layer | undefined;
  loading: boolean = false;

  private _scale: Vector2d = { x: 1, y: 1 };
  private _currentAnimation: string = "idle";
  private _flipped: boolean = false;
  private _flippedY: boolean = false;

  constructor(spriteKey: string, options?: SpriteComponentOptions) {
    this.spriteKey = spriteKey;
    if (options?.animationsKey) this.animationsKey = options.animationsKey;
    if (options?.scale) this._scale = options.scale;
    if (options?.currentAnimation) this._currentAnimation = options.currentAnimation;
    if (options?.layer) this.layer = options.layer;
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
    this.sprite?.scaleX(this._scale.x * -1);
  }

  unflip() {
    this._flipped = false;
    this.sprite?.scaleX(this._scale.x);
  }

  // Vertical mirror (scaleY), distinct from flip()/unflip()'s horizontal one - used by a
  // continuously-rotating sprite (rotate-to-direction.system.ts) to stay right-side-up while
  // aiming left, instead of a static left/right-facing sprite mirroring horizontally.
  isFlippedY() {
    return this._flippedY;
  }

  flipY() {
    this._flippedY = true;
    this.sprite?.scaleY(this._scale.y * -1);
  }

  unflipY() {
    this._flippedY = false;
    this.sprite?.scaleY(this._scale.y);
  }
}

// * Required to generate code
export default SpriteComponent.name;