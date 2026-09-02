// Combat range component - distinct from CollisionBox (physical blocking). Anchored the same
// way as every other entity: (offsetX, offsetY) is the box's top-left relative to the entity's
// Position, which is itself always a top-left origin.
export class Hitbox {
  name = this.constructor.name;

  constructor(
    public width: number,
    public height: number,
    public offsetX: number = 0,
    public offsetY: number = 0,
  ) {}
}

// * Required to generate code
export default Hitbox.name;
