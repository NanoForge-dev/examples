/**
 * Turns an entity's `Transform3D` on its own. Needs the `spin3D` system.
 *
 * @component
 * @side shared
 * @group Speed color=#f0a33a - Degrees per second around each axis.
 */
export class Spin3D {
  name = "Spin3D";

  constructor(
    /** @group Speed */
    public x = 0,
    /** @group Speed */
    public y = 0,
    /** @group Speed */
    public z = 0,
  ) {}
}
