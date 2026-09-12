export class DirectionRotatorComponent {
  name = this.constructor.name;
  enable: boolean = true;
  offset: number;
  // A sprite that rotates through the full circle (a held weapon, the hand holding it) reads
  // upside-down for half its arc unless mirrored vertically while aiming left - see
  // rotate-to-direction.system.ts. Off by default since not every rotating sprite needs it
  // (e.g. the health bar, which never rotates at all).
  mirrorWhenFacingLeft: boolean;

  constructor(offset: number = 0, enable: boolean = true, mirrorWhenFacingLeft: boolean = false) {
    this.offset = offset;
    this.enable = enable;
    this.mirrorWhenFacingLeft = mirrorWhenFacingLeft;
  }
}
