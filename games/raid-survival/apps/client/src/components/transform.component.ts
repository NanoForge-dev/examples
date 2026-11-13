/**
 * Position and rotation of an entity in the world, in pixels and degrees.
 *
 * @component
 * @side client
 */
export class TransformComponent {
  name = "TransformComponent";

  constructor(
    /** Horizontal position, in pixels. */
    public x: number = 0,
    /** Vertical position, in pixels. */
    public y: number = 0,
    /** Rotation, in degrees. */
    public rotation: number = 0,
  ) {}
}
