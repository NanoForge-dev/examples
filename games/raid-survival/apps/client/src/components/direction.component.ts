/**
 * Where an entity aims, as a vector, from the server or the mouse.
 *
 * @component
 * @side client
 */
export class Direction {
  name = "Direction";

  constructor(
    public x: number,
    public y: number,
  ) {}
}
