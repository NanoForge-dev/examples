/**
 * Where an entity is in the 3D world, and how it is turned.
 *
 * @component
 * @side shared
 * @group Position color=#4aa3ff - World units from the origin.
 * @group Rotation color=#36c5a0 - Degrees around each axis.
 */
export class Transform3D {
  name = "Transform3D";

  constructor(
    /** @group Position @preset vector.x */
    public x = 0,
    /** @group Position @preset vector.y */
    public y = 0,
    /** @group Position */
    public z = 0,
    /** @group Rotation */
    public rotationX = 0,
    /** @group Rotation */
    public rotationY = 0,
    /** @group Rotation */
    public rotationZ = 0,
  ) {}
}
