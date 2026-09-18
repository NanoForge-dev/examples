import { type WeaponType } from "../weapon-catalog";

// Marker on a player's single weapon child entity - found via ChildrenComponent.parentId.
export class Weapon {
  name = this.constructor.name;

  constructor(
    // null while nothing is equipped - sprite is hidden in that state.
    public weaponType: WeaponType | null,
    // Base DirectionRotatorComponent aim offset - weapon-reload-animation.system.ts adds an
    // oscillating delta on top while reloading, then restores this exactly.
    public baseRotationOffset: number,
  ) {}

  reloading: boolean = false;
  reloadElapsed: number = 0;
  // Real reload duration for the weapon currently reloading, carried from the server's
  // weaponState packet so the reload animation spans the actual duration.
  reloadDurationSeconds: number = 0;

  // One-shot recoil/muzzle-flash pulse, set on this player's weaponFired broadcast and cleared by
  // weapon-reload-animation.system.ts once catalog.shootSeconds elapses.
  firing: boolean = false;
  firingElapsed: number = 0;
}

// * Required to generate code
export default Weapon.name;
