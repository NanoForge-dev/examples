import { type WeaponType } from "../weapon-catalog";

export type WeaponState = "idle" | "reloading";

// One record per weapon TYPE the player owns - just ownership + the ammo reserve bought/refilled
// for it. Magazine/reload/cooldown are NOT here - see WeaponFireState below for why.
export interface OwnedWeapon {
  weaponType: WeaponType;
  reserveAmmo: number; // -1 = infinite (smallGun only)
}

// The single equipped weapon's firing state: magazine, reload progress, fire cooldown. Split out
// from OwnedWeapon so switching weapons doesn't need to zero/rebuild ownership - see
// weapon.system.ts, which creates one on equip (pulling a full magazine out of reserve) and tears
// it down on unequip (returning whatever's left in it back to reserve), so equip/unequip is
// always ammo-neutral.
export interface WeaponFireState {
  magazineAmmo: number;
  state: WeaponState;
  reloadRemaining: number;
  cooldownRemaining: number;
}

// A player can own more than one weapon (smallGun always; others via buyWeapon) but only ever
// has ONE equipped at a time - only one weapon at a time is better (per design), not dual
// wielding. `equippedWeaponType`/`state` are `null` while nothing is equipped (fires nothing,
// renders no weapon sprite client-side).
export class WeaponInventory {
  name = this.constructor.name;

  owned: OwnedWeapon[] = [];
  equippedWeaponType: WeaponType | null = null;
  state: WeaponFireState | null = null;
}

// * Required to generate code
export default WeaponInventory.name;
