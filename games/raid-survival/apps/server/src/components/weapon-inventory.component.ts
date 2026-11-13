import { type WeaponType } from "@raid-survival/shared/weapon-catalog";

export type WeaponState = "idle" | "reloading";

// Per-owned-weapon-type record: ownership + ammo reserve only. Magazine/reload/cooldown live on
// WeaponFireState instead.
export interface OwnedWeapon {
  weaponType: WeaponType;
  reserveAmmo: number; // -1 = infinite (smallGun only)
}

// Single equipped weapon's live firing state, separate from OwnedWeapon so switching weapons
// doesn't touch ownership. weapon system creates/tears this down on equip/unequip, always
// ammo-neutral (magazine drawn from / returned to reserve).
export interface WeaponFireState {
  magazineAmmo: number;
  state: WeaponState;
  reloadRemaining: number;
  cooldownRemaining: number;
}

/**
 * A player can own several weapons but only equips one at a time (no dual wielding).
 * `equippedWeaponType`/`state` are null while nothing's equipped.
 *
 * @component
 * @side server
 */
export class WeaponInventory {
  name = "WeaponInventory";

  owned: OwnedWeapon[] = [];
  equippedWeaponType: WeaponType | null = null;
  state: WeaponFireState | null = null;
}
