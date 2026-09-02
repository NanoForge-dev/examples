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

// Buying an unowned weapon. Mirrors build-packet.handler.ts's exact validate -> reject-or-proceed
// -> mutate -> broadcast flow.
export function buyWeaponPacketHandler(clientId: number, packet: any, registry: Registry, ctx: Context): void {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();

  if (gameStatus.status !== GameStatusEnum.InGame) return;

  const weaponType = packet.weaponType;
  if (!isWeaponType(weaponType)) return reject(network, clientId, "unknown weapon type");

  const client = clients.find((c) => c.clientId === clientId);
  if (!client) return;

  const inventory: WeaponInventory | undefined = registry.getEntityComponent(registry.entityFromIndex(client.entityId), WeaponInventory);
  if (!inventory) return;

  const catalog = WEAPON_CATALOG[weaponType];
  if (catalog.alwaysOwned) return reject(network, clientId, "not purchasable");
  if (inventory.owned.some((w) => w.weaponType === weaponType)) return reject(network, clientId, "already owned");

  const moneyEntities: { Money: Money }[] = registry.getZipper([Money]);
  const money = moneyEntities[0]?.Money;
  if (!money) return;

  if (money.amount < catalog.cost) return reject(network, clientId, "not enough money");

  money.amount -= catalog.cost;
  // Arrives loaded: reserve holds the catalog's starting reserve PLUS a full magazine's worth -
  // ownership alone doesn't equip it to a hand (equipWeaponPacketHandler does that separately),
  // and it's equipping that actually pulls a magazine out of reserve (see there). Seeding it this
  // way means the first equip nets exactly today's "N in mag, starting reserve in reserve" feel,
  // whichever hand it ends up in.
  inventory.owned.push({ weaponType, reserveAmmo: catalog.startingReserve + catalog.magazineSize });

  sendToInGamePlayers(network, {
    type: "weaponInventory",
    id: client.entityId,
    leftWeaponType: inventory.leftWeaponType,
    rightWeaponType: inventory.rightWeaponType,
    weapons: inventory.owned.map((w) => ({ weaponType: w.weaponType, reserveAmmo: w.reserveAmmo })),
  });
  sendToInGamePlayers(network, { type: "money", amount: money.amount });
}
