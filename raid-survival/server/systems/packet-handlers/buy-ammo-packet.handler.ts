import { Registry } from "@nanoforge-dev/ecs-client";
import { Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { clients, gameStatus, GameStatusEnum } from "../../main";
import { sendToInGamePlayers } from "../../network-utils";
import { Money } from "../../components/money.component";
import { WeaponInventory } from "../../components/weapon-inventory.component";
import { WEAPON_CATALOG, isWeaponType } from "../../weapon-catalog";

function reject(network: NetworkServerLibrary, clientId: number, reason: string): void {
  network.tcp.sendToClient(
    clientId,
    new TextEncoder().encode(JSON.stringify({ type: "buyAmmo", result: "rejected", reason })),
  );
}

// Buying a reserve-ammo refill for an ALREADY-owned weapon - same request target as buyWeapon
// (clicking a weapon's shop entry), server decides which flow applies based on ownership.
export function buyAmmoPacketHandler(
  clientId: number,
  packet: any,
  registry: Registry,
  ctx: Context,
): void {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();

  if (gameStatus.status !== GameStatusEnum.InGame) return;

  const weaponType = packet.weaponType;
  if (!isWeaponType(weaponType)) return reject(network, clientId, "unknown weapon type");

  const client = clients.find((c) => c.clientId === clientId);
  if (!client) return;

  const inventory: WeaponInventory | undefined = registry.getEntityComponent(
    registry.entityFromIndex(client.entityId),
    WeaponInventory,
  );
  if (!inventory) return;

  const owned = inventory.owned.find((w) => w.weaponType === weaponType);
  if (!owned) return reject(network, clientId, "not owned");

  const catalog = WEAPON_CATALOG[weaponType];
  if (catalog.alwaysOwned || catalog.infiniteReserve)
    return reject(network, clientId, "no ammo to buy");
  if (owned.reserveAmmo >= catalog.maxReserve) return reject(network, clientId, "ammo full");

  const moneyEntities: { Money: Money }[] = registry.getZipper([Money]);
  const money = moneyEntities[0]?.Money;
  if (!money) return;

  if (money.amount < catalog.ammoRefillCost) return reject(network, clientId, "not enough money");

  money.amount -= catalog.ammoRefillCost;
  owned.reserveAmmo = Math.min(owned.reserveAmmo + catalog.ammoRefillAmount, catalog.maxReserve);

  sendToInGamePlayers(network, {
    type: "weaponInventory",
    id: client.entityId,
    weaponType: inventory.equippedWeaponType,
    weapons: inventory.owned.map((w) => ({ weaponType: w.weaponType, reserveAmmo: w.reserveAmmo })),
  });
  sendToInGamePlayers(network, { type: "money", amount: money.amount });

  // weaponInventory above keeps the shop panel's owned/reserve numbers correct, but the
  // bottom-left ammo HUD is driven exclusively by "ammo" packets (ammo-packet.handler.ts is the
  // only writer of that Text) - weaponInventory never touches it. Without this, refilling reserve
  // on the weapon currently in hand leaves the HUD showing its stale pre-refill number (e.g. still
  // "0 / 0") until the next shot/reload happens to broadcast one. Only when the refilled weapon is
  // the equipped one - a refill for some other owned-but-holstered weapon has no live magazine
  // value to report, and would otherwise stomp the HUD with the wrong weapon's numbers.
  if (inventory.equippedWeaponType === weaponType && inventory.state) {
    sendToInGamePlayers(network, {
      type: "ammo",
      id: client.entityId,
      weaponType,
      magazineAmmo: inventory.state.magazineAmmo,
      reserveAmmo: owned.reserveAmmo,
    });
  }
}
