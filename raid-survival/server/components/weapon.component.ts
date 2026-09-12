import { type WeaponType } from "../weapon-catalog";

export type WeaponState = "idle" | "reloading";

export class Weapon {
  name = this.constructor.name;

  constructor(
    public weaponType: WeaponType,
    public magazineAmmo: number,
    // -1 = infinite (never runs out, reload always succeeds regardless of this value).
    public reserveAmmo: number,
  ) {}

  state: WeaponState = "idle";
  // Seconds left before a reload in progress finishes (weapon.system.ts).
  reloadRemaining: number = 0;
  // Seconds left before the next shot is allowed (1 / fireRatePerSecond after each shot).
  cooldownRemaining: number = 0;
}

// * Required to generate code
export default Weapon.name;
