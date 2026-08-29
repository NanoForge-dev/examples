export class DirectionRotatorComponent {
  name = this.constructor.name;
  enable: boolean = true;
  offset: number;
  // A sprite that rotates through the full circle (the held weapon) reads upside-down for half
  // its arc unless mirrored vertically while aiming left - see rotate-to-direction.system.ts.
  // Off by default (e.g. the hand) since not every rotating sprite needs it.
  mirrorWhenFacingLeft: boolean;

  constructor(offset: number = 0, enable: boolean = true, mirrorWhenFacingLeft: boolean = false) {
    this.offset = offset;
    this.enable = enable;
    this.mirrorWhenFacingLeft = mirrorWhenFacingLeft;
  }
}
