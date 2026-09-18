// Damage is snapshotted at fire time so switching weapons mid-flight can't alter an already-fired
// bullet. Collision/lifetime is owned by bullet.system.ts; movement by move.system.ts generically.
export class Bullet {
  name = this.constructor.name;

  constructor(public damage: number) {}
}

// * Required to generate code
export default Bullet.name;
