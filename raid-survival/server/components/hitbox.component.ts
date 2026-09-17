// Combat range, distinct from CollisionBox (physical blocking). offsetX/offsetY are relative to
// Position's top-left origin.
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
