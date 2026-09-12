import { Circle, Rect, Text } from "@nanoforge-dev/graphics-2d";
import { type WeaponType } from "../weapon-catalog";
import { type ScreenBox } from "./build-mode.component";

export interface WeaponShopEntry {
  weaponType: WeaponType;
  buyRect: Rect;
  buyText: Text;
  costText: Text;
  // Only present for non-alwaysOwned entries (none currently) - build-mode.system.ts also hides
  // costText/costIcon per-tick whenever there's nothing to spend on this entry right now (owned
  // with no refill cost, e.g. smallGun's infinite reserve).
  costIcon: Circle | undefined;
  // One button per entry now (dual wielding removed) - toggles this weapon equipped/unequipped;
  // its label flips between "Select" and "Selected" (build-mode.system.ts).
  selectButton: Rect;
  selectLabel: Text;
}

// Reserve only, not magazine - a weapon type's magazine lives on the single equipped weapon's own
// fire state now (see weapon-inventory.component.ts server-side), so a shop entry for a
// currently-unequipped type has no "the" magazine value to show anyway. Reserve stays meaningfully
// per-type (one shared bank), so that's what the shop shows; the bottom-left ammo HUD is what
// shows the equipped weapon's live magazine content.
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
  equippedWeaponType: WeaponType | null = null;

  // One-shot intent flag: a shop button's click handler (built in start-game-packet.handler.ts,
  // no access to the network client) sets this, and build-mode.system.ts's per-tick pass (which
  // does have ctx/network - same split buildBuildMode/build-mode.system.ts already use for
  // building placement) sends the actual packet and clears the flag the next tick.
  pendingBuyType: WeaponType | null = null;
  // Wrapped (not a bare WeaponType | null) so "no pending request" (outer null) is distinguishable
  // from "pending request to unequip" (inner weaponType: null).
  pendingEquip: { weaponType: WeaponType | null } | null = null;

  constructor(
    public entries: WeaponShopEntry[],
    public shopBounds: ScreenBox,
    // One-time caption under the column explaining the buy/refill click - see buildWeaponShop.
    public hintText: Text,
  ) {}
}

// * Required to generate code
export default WeaponShopComponent.name;
