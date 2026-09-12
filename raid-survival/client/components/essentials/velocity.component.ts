export class Velocity {
  name = this.constructor.name;

  constructor(
    public x: number,
    public y: number,
  ) {}
}

// * Required to generate code
export default Velocity.name;
