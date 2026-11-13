import type { ClientMessageOf } from "@raid-survival/shared/protocol";
import { clientOf, inGame, teamMoney } from "../queries";
import type { Registry } from "@nanoforge-dev/ecs/server";
import type { Context } from "@nanoforge-dev/common";

import { broadcast, sendTo } from "../broadcast";
import { WeaponInventory } from "../components/weapon-inventory.component";
import { WEAPON_CATALOG, isWeaponType } from "@raid-survival/shared/weapon-catalog";

const reject = (ctx: Context, clientId: string, reason: string): void =>
  sendTo(ctx, clientId, { type: "buyWeapon", result: "rejected", reason });

// Buys an unowned weapon.
export const buyWeaponHandler = (
  clientId: string,
  packet: ClientMessageOf<"buyWeapon">,
  registry: Registry,
  ctx: Context,
): void => {

  if (!inGame(registry)) return;

  const weaponType = packet.weaponType;
  if (!isWeaponType(weaponType)) return reject(ctx, clientId, "unknown weapon type");

  const client = clientOf(registry, clientId);
  if (!client) return;

  const inventory: WeaponInventory | undefined = registry.getEntityComponent(
    registry.entityFromIndex(client.id),
    WeaponInventory,
  );
  if (!inventory) return;

  const catalog = WEAPON_CATALOG[weaponType];
  if (catalog.alwaysOwned) return reject(ctx, clientId, "not purchasable");
  if (inventory.owned.some((w) => w.weaponType === weaponType))
    return reject(ctx, clientId, "already owned");

  const money = teamMoney(registry);
  if (!money) return;

  if (money.amount < catalog.cost) return reject(ctx, clientId, "not enough money");

  money.amount -= catalog.cost;
  // Ownership alone doesn't equip it - equipWeaponHandler pulls a magazine out of reserve
  // when it's actually equipped, so reserve is seeded with a full magazine on top of the starting
  // amount. infiniteReserve weapons keep the catalog's -1 sentinel instead.
  const startingReserve = catalog.infiniteReserve
    ? catalog.startingReserve
    : catalog.startingReserve + catalog.magazineSize;
  inventory.owned.push({ weaponType, reserveAmmo: startingReserve });

  broadcast(ctx, {
    type: "weaponInventory",
    id: client.id,
    weaponType: inventory.equippedWeaponType,
    weapons: inventory.owned.map((w) => ({ weaponType: w.weaponType, reserveAmmo: w.reserveAmmo })),
  });
  broadcast(ctx, { type: "money", amount: money.amount });
};
