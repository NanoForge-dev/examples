export class Health {
  name = this.constructor.name;

  constructor(
    public current: number,
    public max: number,
  ) {}
}

// * Required to generate code
export default Health.name;
