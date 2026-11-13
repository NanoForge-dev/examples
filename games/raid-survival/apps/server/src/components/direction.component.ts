/**
 * Where an entity faces, as a vector. Visual only: shots aim at the mouse position.
 *
 * @component
 * @side server
 */
export class Direction {
  name = "Direction";

  constructor(
    /** Horizontal part. */
    public x = 1,
    /** Vertical part. */
    public y = 0,
  ) {}
}
