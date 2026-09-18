import { Circle, Rect, Text } from "@nanoforge-dev/graphics-2d";
import { type WeaponType } from "../weapon-catalog";
import { type ScreenBox } from "./build-mode.component";

export interface WeaponShopEntry {
  weaponType: WeaponType;
  buyRect: Rect;
  buyText: Text;
  costText: Text;
  costIcon: Circle | undefined;
  selectButton: Rect;
  selectLabel: Text;
}

// Reserve only, not magazine - the equipped weapon's magazine lives in its own fire state
// (weapon-inventory.component.ts, server); the bottom-left ammo HUD shows that live value.
export interface OwnedWeaponAmmo {
  reserveAmmo: number;
}

// Singleton, local player only. Visibility/button state owned by build-mode.system.ts; data kept
// in sync by weapon-inventory-packet.handler.ts and ammo-packet.handler.ts.
export class WeaponShopComponent {
  name = this.constructor.name;

  owned: Map<WeaponType, OwnedWeaponAmmo> = new Map();
  equippedWeaponType: WeaponType | null = null;

  // One-shot intent flags: a shop button's click handler (no access to the network client) sets
  // these, and build-mode.system.ts's per-tick pass sends the actual packet and clears them.
  pendingBuyType: WeaponType | null = null;
  // Wrapped so "no pending request" (outer null) is distinguishable from "pending unequip"
  // (inner weaponType: null).
  pendingEquip: { weaponType: WeaponType | null } | null = null;

  constructor(
    public entries: WeaponShopEntry[],
    public shopBounds: ScreenBox,
    public hintText: Text,
  ) {}
}

// * Required to generate code
export default WeaponShopComponent.name;
