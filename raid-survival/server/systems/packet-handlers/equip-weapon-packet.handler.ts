import { Registry } from "@nanoforge-dev/ecs-client";
import { Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { clients, gameStatus, GameStatusEnum } from "../../main";
import { sendToInGamePlayers } from "../../network-utils";
import { WeaponInventory, type WeaponFireState } from "../../components/weapon-inventory.component";
import { WEAPON_CATALOG, isWeaponType, type WeaponType } from "../../weapon-catalog";

function reject(network: NetworkServerLibrary, clientId: number, reason: string): void {
  network.tcp.sendToClient(
    clientId,
    new TextEncoder().encode(JSON.stringify({ type: "equipWeapon", result: "rejected", reason })),
  );
}

// Clears the equipped weapon's fire state, returning whatever's left in its magazine to that
// weapon's shared reserve (skipped for infiniteReserve weapons). Makes equip/unequip
// ammo-neutral - nothing is gained by switching weapons back and forth.
function releaseEquipped(inventory: WeaponInventory): void {
  if (inventory.equippedWeaponType && inventory.state) {
    const catalog = WEAPON_CATALOG[inventory.equippedWeaponType];
    if (!catalog.infiniteReserve) {
      const owned = inventory.owned.find((w) => w.weaponType === inventory.equippedWeaponType);
      if (owned) owned.reserveAmmo += inventory.state.magazineAmmo;
    }
  }
  inventory.equippedWeaponType = null;
  inventory.state = null;
}

// Equips weaponType, pulling a fresh magazine out of its shared reserve (clamped to what's
// actually available). Caller must releaseEquipped first if something else was already equipped.
function claimWeapon(inventory: WeaponInventory, weaponType: WeaponType): void {
  const catalog = WEAPON_CATALOG[weaponType];
  const owned = inventory.owned.find((w) => w.weaponType === weaponType);
  const taken = catalog.infiniteReserve
    ? catalog.magazineSize
    : Math.min(catalog.magazineSize, owned?.reserveAmmo ?? 0);
  if (!catalog.infiniteReserve && owned) owned.reserveAmmo -= taken;

  inventory.equippedWeaponType = weaponType;
  inventory.state = {
    magazineAmmo: taken,
    state: "idle",
    reloadRemaining: 0,
    cooldownRemaining: 0,
  };
}

// Equips (or, with weaponType:null, unequips) an owned weapon - only one at a time. Broadcast to
// everyone, since every client needs to render every player's hands, not just their own.
export function equipWeaponPacketHandler(
  clientId: number,
  packet: any,
  registry: Registry,
  ctx: Context,
): void {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();

  if (gameStatus.status !== GameStatusEnum.InGame) return;

  const weaponType = packet.weaponType;
  if (weaponType !== null && !isWeaponType(weaponType)) return; // malformed

  const client = clients.find((c) => c.clientId === clientId);
  if (!client) return;

  const inventory: WeaponInventory | undefined = registry.getEntityComponent(
    registry.entityFromIndex(client.entityId),
    WeaponInventory,
  );
  if (!inventory) return;

  if (weaponType !== null && !inventory.owned.some((w) => w.weaponType === weaponType)) {
    return reject(network, clientId, "not owned");
  }

  releaseEquipped(inventory);

  if (weaponType !== null) claimWeapon(inventory, weaponType);

  sendToInGamePlayers(network, {
    type: "weaponInventory",
    id: client.entityId,
    weaponType: inventory.equippedWeaponType,
    weapons: inventory.owned.map((w) => ({ weaponType: w.weaponType, reserveAmmo: w.reserveAmmo })),
  });

  // weaponInventory doesn't carry magazine state - send an ammo packet too so the HUD updates
  // immediately instead of waiting for the next shot/reload. Skipped on unequip.
  if (weaponType !== null) {
    const newState: WeaponFireState | null = inventory.state;
    const ownedForType = inventory.owned.find((w) => w.weaponType === weaponType);
    sendToInGamePlayers(network, {
      type: "ammo",
      id: client.entityId,
      weaponType,
      magazineAmmo: newState?.magazineAmmo ?? 0,
      reserveAmmo: ownedForType?.reserveAmmo ?? 0,
    });
  }
}
