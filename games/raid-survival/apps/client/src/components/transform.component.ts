/**
 * Position and rotation of an entity in the world, in pixels and degrees.
 *
 * @component
 * @side client
 */
export class TransformComponent {
  name = "TransformComponent";

  constructor(
    public x: number = 0,
    public y: number = 0,
    public rotation: number = 0,
  ) {}
}
