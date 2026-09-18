export class CollisionBox {
  name = this.constructor.name;

  constructor(
    public width: number,
    public height: number,
  ) {}
}

// * Required to generate code
export default CollisionBox.name;
