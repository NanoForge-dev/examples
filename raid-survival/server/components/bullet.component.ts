// Marker + payload for a fired projectile (bullet.system.ts owns its collision/lifetime;
// move.system.ts already drives its movement generically from Position+Velocity). Damage is
// copied from the catalog at fire time so a weapon change mid-flight can't retroactively alter
// an already-fired bullet.
export class Bullet {
  name = this.constructor.name;

  constructor(public damage: number) {}
}

// * Required to generate code
export default Bullet.name;
