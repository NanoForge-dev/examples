import { Layer, Sprite, Vector2d } from "@nanoforge-dev/graphics-2d";

interface SpriteComponentOptions {
  animationsKey?: string;
  layer?: Layer;
  scale?: Vector2d;
  currentAnimation?: string;
  frameRate?: number;
  // Native-pixel point within the frame that the rotation pivot sits on and that
  // TransformComponent's position resolves to (see sprite.system.ts) - defaults to the frame's own
  // geometric center (width/2, height/2) when omitted, which is correct for art that's naturally
  // drawn centered in its crop. A weapon held by a hand isn't necessarily centered though (e.g.
  // Shotgun-Shot.png's 52x32 frame has the gun's grip well off to one side, with empty space on
  // the muzzle side for the recoil/flash frames) - without overriding this, the sprite is
  // positioned/rotated around its crop's geometric center instead of the point a hand is actually
  // holding it at, visibly displacing it away from the hand by however far off-center the art is.
  pivot?: Vector2d;
}

export class SpriteComponent {
  name = this.constructor.name;
  spriteKey: string;
  sprite: Sprite | undefined;
  animationsKey?: string | undefined;
  layer: Layer | undefined;
  loading: boolean = false;
  // Read by spriteSystem at Sprite-construction time only (like width/height/animations) - not
  // reactive on its own; changing it takes effect on the next setSpriteKey-triggered rebuild, not
  // on an already-live sprite. Defaults to 7, matching every sprite before this field existed.
  frameRate: number = 7;

  private _scale: Vector2d = { x: 1, y: 1 };
  private _currentAnimation: string = "idle";
  private _flipped: boolean = false;
  private _flippedY: boolean = false;
  private _pivot: Vector2d | undefined;

  constructor(spriteKey: string, options?: SpriteComponentOptions) {
    this.spriteKey = spriteKey;
    if (options?.animationsKey) this.animationsKey = options.animationsKey;
    if (options?.scale) this._scale = options.scale;
    if (options?.currentAnimation) this._currentAnimation = options.currentAnimation;
    if (options?.layer) this.layer = options.layer;
    if (options?.frameRate) this.frameRate = options.frameRate;
    if (options?.pivot) this._pivot = options.pivot;
  }

  // Swaps to a different source image (and, usually, a different animations file) at runtime -
  // e.g. the shotgun's held-weapon sprite switching from its static weapons.png icon to
  // Shotgun-Reload.png's real animation while reloading, then back. spriteSystem only ever
  // creates the underlying Konva Sprite ONCE per component (guarded on `!sprite`), keyed off
  // whatever spriteKey/animationsKey were set at that time - so this destroys the current one and
  // clears the fields spriteSystem gates on, forcing it to load the new image and build a fresh
  // Sprite next tick, exactly like a brand-new entity would. Also resets flip state: a freshly
  // built Konva Sprite always starts unflipped (scaleX/Y at their base, non-negated), so leaving
  // _flipped/_flippedY at whatever they were on the OLD sprite would desync
  // rotate-to-direction.system.ts's hysteresis (it trusts isFlipped()/isFlippedY() to reflect the
  // live sprite, and would then skip re-applying a flip the new sprite actually needs).
  // currentAnimation defaults to "idle" for the same reason SpriteComponentOptions.currentAnimation
  // is mostly decorative: spriteSystem always constructs a fresh Sprite on "idle" regardless of
  // what _currentAnimation says, so a real animation key must be set again via setAnimation() once
  // the new sprite actually exists (see weapon-reload-animation.system.ts for that idempotent
  // every-tick check).
  setSpriteKey(spriteKey: string, animationsKey?: string, currentAnimation: string = "idle"): void {
    this.spriteKey = spriteKey;
    this.animationsKey = animationsKey;
    this._currentAnimation = currentAnimation;
    this._flipped = false;
    this._flippedY = false;
    this.sprite?.destroy();
    this.sprite = undefined;
    this.loading = false;
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

  getPivot(): Vector2d | undefined {
    return this._pivot;
  }

  // Not applied to an already-live sprite (Konva's offsetX/Y, unlike scale, would also need the
  // rendered position recomputed the same tick to avoid a one-frame jump) - like frameRate, this
  // is read by spriteSystem only at Sprite-construction time, so a change here takes effect on the
  // next setSpriteKey-triggered rebuild. Pass undefined to go back to the default frame-centered
  // pivot (e.g. re-equipping from a weapon that overrode this to one that doesn't).
  setPivot(pivot: Vector2d | undefined) {
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