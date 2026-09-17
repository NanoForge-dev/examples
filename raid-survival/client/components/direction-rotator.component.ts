export class DirectionRotatorComponent {
  name = this.constructor.name;
  enable: boolean = true;
  offset: number;
  // A sprite that rotates through the full circle reads upside-down for half its arc unless
  // mirrored vertically while aiming left - see rotate-to-direction.system.ts.
  mirrorWhenFacingLeft: boolean;

  constructor(offset: number = 0, enable: boolean = true, mirrorWhenFacingLeft: boolean = false) {
    this.offset = offset;
    this.enable = enable;
    this.mirrorWhenFacingLeft = mirrorWhenFacingLeft;
  }
}
