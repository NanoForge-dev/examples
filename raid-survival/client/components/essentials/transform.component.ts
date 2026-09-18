export class TransformComponent {
  name = this.constructor.name;

  constructor(
    public x: number = 0,
    public y: number = 0,
    public rotation: number = 0,
  ) {}
}

// * Required to generate code
export default TransformComponent.name;
