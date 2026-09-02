import { Circle, Rect, Text } from "@nanoforge-dev/graphics-2d";
import { type WeaponType } from "../weapon-catalog";
import { type ScreenBox } from "./build-mode.component";

export interface WeaponShopEntry {
  weaponType: WeaponType;
  buyRect: Rect;
  buyText: Text;
  costText: Text;
  // Only present for non-alwaysOwned entries (smallGun never shows a cost at all).
  costIcon: Circle | undefined;
  leftButton: Rect;
  rightButton: Rect;
}

// Reserve only, not magazine - a weapon type's magazine is now per-hand (see
// weapon-inventory.component.ts server-side), so a single per-type shop entry has no one
// "the" magazine value to show (and a type can only occupy one hand at a time anyway - see
// equip-weapon-packet.handler.ts). Reserve stays meaningfully per-type (one shared bank), so
// that's what the shop shows; per-hand magazine content is what the bottom-left ammo HUD rows
// are for.
export interface OwnedWeaponAmmo {
  reserveAmmo: number;
}

// Singleton - built once at game start (start-game-packet.handler.ts's buildWeaponShop) and owned
// by build-mode.system.ts (visibility/button state, alongside BuildModeComponent - the shop shows
// and hides together with the build bar, no separate `active` flag of its own) plus
// weapon-inventory-packet.handler.ts and ammo-packet.handler.ts (data, local player only).
export class WeaponShopComponent {
  name = this.constructor.name;

  // What the LOCAL player owns and how much reserve ammo each entry has - kept in sync by
  // weapon-inventory-packet.handler.ts (buy/refill/equip events) AND ammo-packet.handler.ts
  // (every shot/reload tick), the latter being what keeps this from going stale between
  // purchases - see ammo-packet.handler.ts for why both write here.
  owned: Map<WeaponType, OwnedWeaponAmmo> = new Map();
  leftWeaponType: WeaponType | null = null;
  rightWeaponType: WeaponType | null = null;

  // One-shot intent flags: a shop button's click handler (built in start-game-packet.handler.ts,
  // no access to the network client) sets one of these, and build-mode.system.ts's per-tick pass
  // (which does have ctx/network - same split buildBuildMode/build-mode.system.ts already use for
  // building placement) sends the actual packet and clears the flag the next tick.
  pendingBuyType: WeaponType | null = null;
  pendingEquip: { hand: "left" | "right"; weaponType: WeaponType | null } | null = null;

  constructor(
    public entries: WeaponShopEntry[],
    public shopBounds: ScreenBox,
  ) {}
}

// * Required to generate code
export default WeaponShopComponent.name;
