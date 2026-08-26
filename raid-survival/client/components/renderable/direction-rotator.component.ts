export class DirectionRotatorComponent {
  name = this.constructor.name;
  enable: boolean = true;
  offset: number;

  constructor(offset: number = 0, enable: boolean = true) {
    this.offset = offset;
    this.enable = enable;
  }
}
