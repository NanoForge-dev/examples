import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";
import { PLAYER_CLASS_CATALOG } from "@raid-survival/shared/player-class-catalog";
import { WEAPON_CATALOG } from "@raid-survival/shared/weapon-catalog";

import { Login } from "../components/login.component";
import { Position2D } from "../components/position-2d.component";
import { Hitbox } from "../components/hitbox.component";
import { Health } from "../components/health.component";
import { WeaponInventory } from "../components/weapon-inventory.component";
import { LootBox } from "../components/loot-box.component";
import { Money } from "../components/money.component";
import { PlayerClass } from "../components/player-class.component";
import { distanceBetweenHitboxes } from "../zombie-ai";
import { broadcast } from "../broadcast";

const PICKUP_RANGE = 10;
const HEAL_BOX_AMOUNT = 50;
const GOLD_BOX_AMOUNT = 50;

/**
 * Auto-pickup: the first alive player within PICKUP_RANGE of a dropped loot box (spawned by
 * zombie-death.system.ts) claims it - no keypress needed.
 *
 * @system
 * @side server
 */
export const lootBoxPickupSystem = (registry: Registry, ctx: Context) => {
  const boxes: { id: number; LootBox: LootBox; Position2D: Position2D; Hitbox: Hitbox }[] =
    registry.getIndexedZipper([LootBox, Position2D, Hitbox]);
  if (boxes.length === 0) return;

  const players: {
    id: number;
    Login: Login;
    Position2D: Position2D;
    Hitbox: Hitbox;
    Health: Health;
    WeaponInventory: WeaponInventory;
    PlayerClass: PlayerClass;
  }[] = registry.getIndexedZipper([
    Login,
    Position2D,
    Hitbox,
    Health,
    WeaponInventory,
    PlayerClass,
  ]);

  const moneyEntities: { Money: Money }[] = registry.getZipper([Money]);
  const money = moneyEntities[0]?.Money;

  for (const box of boxes) {
    // A downed player (0 HP) must never pick one up - a heal box would revive them outside
    // revive.system.ts's channel entirely.
    const picker = players.find(
      (p) =>
        p.Health.current > 0 &&
        distanceBetweenHitboxes(p.Position2D, p.Hitbox, box.Position2D, box.Hitbox) <= PICKUP_RANGE,
    );
    if (!picker) continue;

    switch (box.LootBox.lootType) {
      case "heal": {
        // A healer's own heal box heals them fully instead of the usual flat amount. The popup
        // shows what was actually restored, not a flat amount that could overstate it.
        const healerFullHeal = PLAYER_CLASS_CATALOG[picker.PlayerClass.playerClass].healBoxFullHeal;
        const before = picker.Health.current;
        picker.Health.current = healerFullHeal
          ? picker.Health.max
          : Math.min(picker.Health.max, picker.Health.current + HEAL_BOX_AMOUNT);
        const healed = picker.Health.current - before;
        broadcast(ctx, {
          type: "heal",
          id: picker.id,
          health: { current: picker.Health.current, max: picker.Health.max },
        });
        broadcast(ctx, {
          type: "loot",
          position: { x: box.Position2D.x, y: box.Position2D.y },
          amount: healed,
          text: `+${healed} HP`,
          color: "#4CAF50",
        });
        break;
      }
      case "gold": {
        if (money) {
          money.amount += GOLD_BOX_AMOUNT;
          broadcast(ctx, { type: "money", amount: money.amount });
        }
        broadcast(ctx, {
          type: "loot",
          position: { x: box.Position2D.x, y: box.Position2D.y },
          amount: GOLD_BOX_AMOUNT,
        });
        break;
      }
      case "ammo": {
        // Refills reserve for every owned weapon type, not just the equipped one.
        for (const owned of picker.WeaponInventory.owned) {
          const catalog = WEAPON_CATALOG[owned.weaponType];
          if (!catalog.infiniteReserve) owned.reserveAmmo = catalog.maxReserve;
        }
        // Tops off the equipped magazine too.
        const weaponType = picker.WeaponInventory.equippedWeaponType;
        const state = picker.WeaponInventory.state;
        if (weaponType && state) {
          const catalog = WEAPON_CATALOG[weaponType];
          state.magazineAmmo = catalog.magazineSize;
          const owned = picker.WeaponInventory.owned.find((w) => w.weaponType === weaponType);
          broadcast(ctx, {
            type: "ammo",
            id: picker.id,
            weaponType,
            magazineAmmo: state.magazineAmmo,
            reserveAmmo: owned?.reserveAmmo ?? -1,
          });
        }
        broadcast(ctx, {
          type: "loot",
          position: { x: box.Position2D.x, y: box.Position2D.y },
          amount: 0,
          text: "Ammo refilled!",
          color: "#F5F2E9",
        });
        break;
      }
    }

    broadcast(ctx, { type: "kill", id: box.id });
    registry.killEntity(registry.entityFromIndex(box.id));
  }
};
