export class Clickable {
  name = this.constructor.name;

  constructor(
    public size: { x: number; y: number },
    public onClick: () => unknown,
  ) {}
}

// * Required to generate code
export default Clickable.name;
