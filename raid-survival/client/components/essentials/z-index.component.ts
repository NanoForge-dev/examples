export class ZIndexComponent {
  name = this.constructor.name;

  constructor(
    public value: number = 0
  ) {}
}