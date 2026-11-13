/**
 * Draw order of a sprite on its layer (`zOrderSystem`): higher is drawn on top.
 *
 * @component
 * @side client
 */
export class ZIndexComponent {
  name = "ZIndexComponent";

  constructor(
    public value: number = 0
  ) {}
}
