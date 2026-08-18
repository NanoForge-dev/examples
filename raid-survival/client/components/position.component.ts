export class PositionComponent {
  name = this.constructor.name;
  x: number = 0;
  y: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

// * Required to generate code
export default PositionComponent.name;