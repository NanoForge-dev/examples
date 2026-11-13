import { Layer, Sprite } from "@nanoforge-dev/graphics-2d";
import type { Vector } from "@raid-survival/shared/protocol";

interface SpriteComponentOptions {
  animationsKey?: string;
  layer?: Layer;
  scale?: Vector;
  currentAnimation?: string;
  frameRate?: number;
  // Native-pixel point within the frame that rotation pivots around and that TransformComponent's
  // position resolves to (see sprite.system.ts). Defaults to the frame's geometric center; needed
  // when the art's actual grip/anchor point isn't centered in its crop.
  pivot?: Vector;
}

/**
 * An animated sprite from an image of the assets and its animations file, drawn by `spriteSystem`
 * on its layer and animated by `spriteAnimator`.
 *
 * @component
 * @side client
 */
export class SpriteComponent {
  name = "SpriteComponent";
  spriteKey: string;
  sprite: Sprite | undefined;
  animationsKey?: string | undefined;
  layer: Layer | undefined;
  loading: boolean = false;
  // Set by spriteSystem once this entity's load has exhausted its retries. Scoped per-entity, not
  // per-asset, so one entity's failed load can't blacklist a shared spriteKey for others.
  failed: boolean = false;
  // Read by spriteSystem only at Sprite-construction time - a change here takes effect on the
  // next setSpriteKey-triggered rebuild, not on an already-live sprite.
  frameRate: number = 7;

  private _scale: Vector = { x: 1, y: 1 };
  private _currentAnimation: string = "idle";
  private _flipped: boolean = false;
  private _flippedY: boolean = false;
  private _pivot: Vector | undefined;

  constructor(
    /** Path of the image in the assets. */
    spriteKey: string,
    /** The animations file, the layer, the scale, the pivot and the first animation. */
    options?: SpriteComponentOptions,
  ) {
    this.spriteKey = spriteKey;
    if (options?.animationsKey) this.animationsKey = options.animationsKey;
    if (options?.scale) this._scale = options.scale;
    if (options?.currentAnimation) this._currentAnimation = options.currentAnimation;
    if (options?.layer) this.layer = options.layer;
    if (options?.frameRate) this.frameRate = options.frameRate;
    if (options?.pivot) this._pivot = options.pivot;
  }

  // Swaps to a different source image/animations file at runtime. spriteSystem only ever
  // constructs the underlying Konva Sprite once per component (guarded on `!sprite`), so this
  // destroys the current one and clears the gating fields, forcing a fresh build next tick. Also
  // resets flip state, since a freshly built sprite always starts unflipped.
  setSpriteKey(spriteKey: string, animationsKey?: string, currentAnimation: string = "idle"): void {
    this.spriteKey = spriteKey;
    this.animationsKey = animationsKey;
    this._currentAnimation = currentAnimation;
    this._flipped = false;
    this._flippedY = false;
    this.sprite?.destroy();
    this.sprite = undefined;
    this.loading = false;
    this.failed = false;
  }

  getAnimation(): string {
    return this._currentAnimation;
  }

  setAnimation(animation: string) {
    if (animation === this._currentAnimation) return;
    this._currentAnimation = animation;
    this.sprite?.animation(animation);
  }

  getScale(): Vector {
    return this._scale;
  }

  setScale(scale: Vector) {
    this._scale = scale;
    this.sprite?.scale(scale);
  }

  getPivot(): Vector | undefined {
    return this._pivot;
  }

  // Like frameRate, read by spriteSystem only at construction time - takes effect on the next
  // setSpriteKey-triggered rebuild, not the live sprite.
  setPivot(pivot: Vector | undefined) {
    this._pivot = pivot;
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

  // Vertical mirror, distinct from flip()/unflip()'s horizontal one - used by a continuously
  // rotating sprite to stay right-side-up while aiming left.
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
