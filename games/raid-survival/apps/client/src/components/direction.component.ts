/**
 * Where an entity aims, as a vector, from the server or the mouse.
 *
 * @component
 * @side client
 */
export class Direction {
  name = "Direction";

  constructor(
    /** Horizontal part of the direction. */
    public x: number,
    /** Vertical part of the direction. */
    public y: number,
  ) {}
}
