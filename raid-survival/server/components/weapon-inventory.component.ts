import { type WeaponType } from "../weapon-catalog";

export type WeaponState = "idle" | "reloading";

// One record per weapon TYPE the player owns - just ownership + the ammo reserve bought/refilled
// for it (shared bank, spent by whichever hand(s) reload that type). Magazine/reload/cooldown are
// NOT here any more - see HandFireState below for why.
export interface OwnedWeapon {
  weaponType: WeaponType;
  reserveAmmo: number; // -1 = infinite (smallGun only)
}

// Per-hand firing state: magazine, reload progress, fire cooldown. Split out from OwnedWeapon so
// each hand's magazine/reload timer is independent of the other's - a player usually has a
// different weapon type in each hand (equip-weapon-packet.handler.ts now refuses to let the same
// type occupy both hands at once, auto-moving it instead), so left and right need their own timers
// regardless. Only the reserve behind them (OwnedWeapon.reserveAmmo) is shared, same as owning one
// real stock of ammo for a gun. Null while that hand has nothing equipped.
export interface HandFireState {
  magazineAmmo: number;
  state: WeaponState;
  reloadRemaining: number;
  cooldownRemaining: number;
}

// Replaces the old single `Weapon` component - a player can now own more than one weapon
// (smallGun always; others via buyWeapon) and freely assign any owned weapon to either hand via
// equipWeapon. `leftWeaponType`/`rightWeaponType` are `null` while that hand is unassigned (fires
// nothing, renders no weapon sprite client-side); `leftState`/`rightState` mirror that nullability
// 1:1 and hold that hand's own magazine/reload/cooldown - see weapon.system.ts, which creates one
// on equip (pulling a full magazine out of reserve) and tears it down on unequip (returning
// whatever's left in it back to reserve), so equip/unequip is always ammo-neutral.
export class WeaponInventory {
  name = this.constructor.name;

  owned: OwnedWeapon[] = [];
  leftWeaponType: WeaponType | null = null;
  rightWeaponType: WeaponType | null = null;
  leftState: HandFireState | null = null;
  rightState: HandFireState | null = null;
}

// * Required to generate code
export default WeaponInventory.name;
