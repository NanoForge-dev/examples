/**
 * Rotates the sprite of an entity toward its `Direction`, with `rotateToDirectionSystem`.
 *
 * @component
 * @side client
 */
export class DirectionRotatorComponent {
  name = "DirectionRotatorComponent";
  enable: boolean = true;
  offset: number;
  // A sprite that rotates through the full circle reads upside-down for half its arc unless
  // mirrored vertically while aiming left - see rotate-to-direction.system.ts.
  mirrorWhenFacingLeft: boolean;

  constructor(
    /** Angle added to the direction, in degrees. */
    offset: number = 0,
    /** Whether the sprite rotates. */
    enable: boolean = true,
    /** Flips the sprite vertically while it aims left. */
    mirrorWhenFacingLeft: boolean = false,
  ) {
    this.offset = offset;
    this.enable = enable;
    this.mirrorWhenFacingLeft = mirrorWhenFacingLeft;
  }
}
