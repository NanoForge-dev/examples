export class RotationComponent {
  name = this.constructor.name;
  angle: number = 0;

  constructor(angle: number) {
    this.angle = angle;
  }
}