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
    new TextEncoder().encode(JSON.stringify({ type: "buyWeapon", result: "rejected", reason })),
  );
}

// Buys an unowned weapon.
export function buyWeaponPacketHandler(
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

  const catalog = WEAPON_CATALOG[weaponType];
  if (catalog.alwaysOwned) return reject(network, clientId, "not purchasable");
  if (inventory.owned.some((w) => w.weaponType === weaponType))
    return reject(network, clientId, "already owned");

  const moneyEntities: { Money: Money }[] = registry.getZipper([Money]);
  const money = moneyEntities[0]?.Money;
  if (!money) return;

  if (money.amount < catalog.cost) return reject(network, clientId, "not enough money");

  money.amount -= catalog.cost;
  // Ownership alone doesn't equip it - equipWeaponPacketHandler pulls a magazine out of reserve
  // when it's actually equipped, so reserve is seeded with a full magazine on top of the starting
  // amount. infiniteReserve weapons keep the catalog's -1 sentinel instead.
  const startingReserve = catalog.infiniteReserve
    ? catalog.startingReserve
    : catalog.startingReserve + catalog.magazineSize;
  inventory.owned.push({ weaponType, reserveAmmo: startingReserve });

  sendToInGamePlayers(network, {
    type: "weaponInventory",
    id: client.entityId,
    weaponType: inventory.equippedWeaponType,
    weapons: inventory.owned.map((w) => ({ weaponType: w.weaponType, reserveAmmo: w.reserveAmmo })),
  });
  sendToInGamePlayers(network, { type: "money", amount: money.amount });
}
