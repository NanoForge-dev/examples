import type { ClientMessageOf } from "@raid-survival/shared/protocol";
import { clientOf, inGame, teamMoney } from "../queries";
import type { Registry } from "@nanoforge-dev/ecs/server";
import type { Context } from "@nanoforge-dev/common";

import { broadcast, sendTo } from "../broadcast";
import { WeaponInventory } from "../components/weapon-inventory.component";
import { WEAPON_CATALOG, isWeaponType } from "@raid-survival/shared/weapon-catalog";

const reject = (ctx: Context, clientId: string, reason: string): void =>
  sendTo(ctx, clientId, { type: "buyAmmo", result: "rejected", reason });

// Buys a reserve-ammo refill for an already-owned weapon - the server decides buyAmmo vs
// buyWeapon based on ownership.
export const buyAmmoHandler = (
  clientId: string,
  packet: ClientMessageOf<"buyAmmo">,
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

  const owned = inventory.owned.find((w) => w.weaponType === weaponType);
  if (!owned) return reject(ctx, clientId, "not owned");

  const catalog = WEAPON_CATALOG[weaponType];
  if (catalog.alwaysOwned || catalog.infiniteReserve)
    return reject(ctx, clientId, "no ammo to buy");
  if (owned.reserveAmmo >= catalog.maxReserve) return reject(ctx, clientId, "ammo full");

  const money = teamMoney(registry);
  if (!money) return;

  if (money.amount < catalog.ammoRefillCost) return reject(ctx, clientId, "not enough money");

  money.amount -= catalog.ammoRefillCost;
  owned.reserveAmmo = Math.min(owned.reserveAmmo + catalog.ammoRefillAmount, catalog.maxReserve);

  broadcast(ctx, {
    type: "weaponInventory",
    id: client.id,
    weaponType: inventory.equippedWeaponType,
    weapons: inventory.owned.map((w) => ({ weaponType: w.weaponType, reserveAmmo: w.reserveAmmo })),
  });
  broadcast(ctx, { type: "money", amount: money.amount });

  // The ammo HUD is driven only by "ammo" packets, not weaponInventory - send one too, but only
  // when the refilled weapon is the one currently equipped.
  if (inventory.equippedWeaponType === weaponType && inventory.state) {
    broadcast(ctx, {
      type: "ammo",
      id: client.id,
      weaponType,
      magazineAmmo: inventory.state.magazineAmmo,
      reserveAmmo: owned.reserveAmmo,
    });
  }
};
