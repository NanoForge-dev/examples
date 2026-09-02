import { Registry } from "@nanoforge-dev/ecs-client";
import { Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { clients, gameStatus, GameStatusEnum } from "../../main";
import { sendToInGamePlayers } from "../../network-utils";
import { WeaponInventory, type HandFireState } from "../../components/weapon-inventory.component";
import { WEAPON_CATALOG, isWeaponType, type WeaponType } from "../../weapon-catalog";

function reject(network: NetworkServerLibrary, clientId: number, reason: string): void {
  network.tcp.sendToClient(
    clientId,
    new TextEncoder().encode(JSON.stringify({ type: "equipWeapon", result: "rejected", reason })),
  );
}

// Clears a hand's fire state, returning whatever's left in its magazine to that weapon's shared
// reserve (skipped for infiniteReserve weapons, whose reserve is a -1 sentinel, not a real count).
// Makes every equip/unequip round-trip ammo-neutral - nothing is gained by toggling a hand on and
// off, unlike a naive "always hand out a fresh full magazine for free" implementation would.
function releaseHand(inventory: WeaponInventory, hand: "left" | "right"): void {
  const weaponType = hand === "left" ? inventory.leftWeaponType : inventory.rightWeaponType;
  const state = hand === "left" ? inventory.leftState : inventory.rightState;
  if (weaponType && state) {
    const catalog = WEAPON_CATALOG[weaponType];
    if (!catalog.infiniteReserve) {
      const owned = inventory.owned.find((w) => w.weaponType === weaponType);
      if (owned) owned.reserveAmmo += state.magazineAmmo;
    }
  }
  if (hand === "left") {
    inventory.leftWeaponType = null;
    inventory.leftState = null;
  } else {
    inventory.rightWeaponType = null;
    inventory.rightState = null;
  }
}

// Assigns weaponType to a hand, pulling a fresh magazine out of its shared reserve (clamped to
// whatever's actually available - a type whose reserve is running low can and should start with a
// partial or empty magazine, not a free full one). Caller must releaseHand this hand first if it
// already held something - and, per equipWeaponPacketHandler below, must releaseHand the OTHER
// hand first too if it already holds this same weaponType, since one player only ever has one of
// each weapon and can't hold it in both hands at once.
function claimHand(inventory: WeaponInventory, hand: "left" | "right", weaponType: WeaponType): void {
  const catalog = WEAPON_CATALOG[weaponType];
  const owned = inventory.owned.find((w) => w.weaponType === weaponType);
  const taken = catalog.infiniteReserve ? catalog.magazineSize : Math.min(catalog.magazineSize, owned?.reserveAmmo ?? 0);
  if (!catalog.infiniteReserve && owned) owned.reserveAmmo -= taken;

  const state: HandFireState = { magazineAmmo: taken, state: "idle", reloadRemaining: 0, cooldownRemaining: 0 };
  if (hand === "left") {
    inventory.leftWeaponType = weaponType;
    inventory.leftState = state;
  } else {
    inventory.rightWeaponType = weaponType;
    inventory.rightState = state;
  }
}

// Assigns (or, with weaponType:null, unassigns) an OWNED weapon to a hand. Broadcast to everyone,
// not just the requester - every client needs to know what to render in every player's hands, not
// just their own.
export function equipWeaponPacketHandler(clientId: number, packet: any, registry: Registry, ctx: Context): void {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();

  if (gameStatus.status !== GameStatusEnum.InGame) return;

  const hand = packet.hand;
  if (hand !== "left" && hand !== "right") return; // malformed, not a meaningful rejection

  const weaponType = packet.weaponType;
  if (weaponType !== null && !isWeaponType(weaponType)) return; // malformed

  const client = clients.find((c) => c.clientId === clientId);
  if (!client) return;

  const inventory: WeaponInventory | undefined = registry.getEntityComponent(registry.entityFromIndex(client.entityId), WeaponInventory);
  if (!inventory) return;

  if (weaponType !== null && !inventory.owned.some((w) => w.weaponType === weaponType)) {
    return reject(network, clientId, "not owned");
  }

  // Always release whatever this hand currently holds first - its magazine returns to that
  // weapon's own reserve before (if a new type was requested) a fresh magazine is pulled from the
  // new type's reserve. Ammo-neutral either way: unassign alone returns it and stops there;
  // reassign to the same or a different type returns then re-draws.
  releaseHand(inventory, hand);

  // A weapon can't be held in both hands at once - one player only owns one of each type. If the
  // OTHER hand already holds the type just requested here, move it: release it there too (its
  // magazine returns to reserve, same as any other release) before this hand claims a fresh one.
  // Auto-moving instead of rejecting means clicking "L" on a shotgun already equipped in the right
  // hand does something visible (it relocates) rather than silently no-op'ing.
  if (weaponType !== null) {
    const otherHand = hand === "left" ? "right" : "left";
    const otherWeaponType = otherHand === "left" ? inventory.leftWeaponType : inventory.rightWeaponType;
    if (otherWeaponType === weaponType) releaseHand(inventory, otherHand);
  }

  if (weaponType !== null) claimHand(inventory, hand, weaponType);

  sendToInGamePlayers(network, {
    type: "weaponInventory",
    id: client.entityId,
    leftWeaponType: inventory.leftWeaponType,
    rightWeaponType: inventory.rightWeaponType,
    weapons: inventory.owned.map((w) => ({ weaponType: w.weaponType, reserveAmmo: w.reserveAmmo })),
  });

  // The ammo HUD (client) needs to know this hand's fresh magazine immediately, not wait for the
  // next shot/reload - weaponInventory doesn't carry per-hand magazine state (see
  // weapon-inventory.component.ts), only the `ammo` broadcast does. Skipped on unequip
  // (weaponType null): that hand's row is hidden client-side the instant nothing's equipped (see
  // reload-indicator.system.ts), so there's no live value to update - sending one anyway would
  // write a bogus `null`-keyed entry into the client's shop.owned map for no observable benefit.
  if (weaponType !== null) {
    const newState = hand === "left" ? inventory.leftState : inventory.rightState;
    const ownedForType = inventory.owned.find((w) => w.weaponType === weaponType);
    sendToInGamePlayers(network, {
      type: "ammo",
      id: client.entityId,
      hand,
      weaponType,
      magazineAmmo: newState?.magazineAmmo ?? 0,
      reserveAmmo: ownedForType?.reserveAmmo ?? 0,
    });
  }
}
