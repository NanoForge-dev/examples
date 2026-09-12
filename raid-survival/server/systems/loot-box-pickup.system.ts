import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { Login } from "../components/login.component";
import { Position } from "../components/position.component";
import { Hitbox } from "../components/hitbox.component";
import { Health } from "../components/health.component";
import { WeaponInventory } from "../components/weapon-inventory.component";
import { LootBox } from "../components/loot-box.component";
import { Money } from "../components/money.component";
import { PlayerClass } from "../components/player-class.component";
import { PLAYER_CLASS_CATALOG } from "../player-class-catalog";
import { WEAPON_CATALOG } from "../weapon-catalog";
import { distanceBetweenHitboxes } from "./zombie-ai";
import { sendToInGamePlayers } from "../network-utils";

// A little more forgiving than an exact hitbox overlap - "walk near it", not "stand exactly on
// top of the one pixel it occupies". Same idea as TOWER_INTERACT_RANGE/REVIVE_RANGE.
const PICKUP_RANGE = 10;
const HEAL_BOX_AMOUNT = 50;
const GOLD_BOX_AMOUNT = 50;

// Auto-pickup: the first alive player within PICKUP_RANGE of a dropped loot box (zombie-death.
// system.ts spawns these) claims it - no keypress needed, matching the instant/automatic feel of
// the existing coin-drop-on-kill reward this is dropped alongside.
export function lootBoxPickupSystem(registry: Registry, ctx: Context) {
  const boxes: { id: number; LootBox: LootBox; Position: Position; Hitbox: Hitbox }[] =
    registry.getIndexedZipper([LootBox, Position, Hitbox]);
  if (boxes.length === 0) return;

  const players: {
    id: number;
    Login: Login;
    Position: Position;
    Hitbox: Hitbox;
    Health: Health;
    WeaponInventory: WeaponInventory;
    PlayerClass: PlayerClass;
  }[] = registry.getIndexedZipper([Login, Position, Hitbox, Health, WeaponInventory, PlayerClass]);

  const moneyEntities: { Money: Money }[] = registry.getZipper([Money]);
  const money = moneyEntities[0]?.Money;
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();

  for (const box of boxes) {
    // Health.current > 0 - a downed player (0 HP, motionless until revived) must never pick one
    // up: a heal box would quietly revive them at more HP than the 3-second E-channel gives,
    // defeating revive.system.ts entirely.
    const picker = players.find(
      (p) =>
        p.Health.current > 0 &&
        distanceBetweenHitboxes(p.Position, p.Hitbox, box.Position, box.Hitbox) <= PICKUP_RANGE,
    );
    if (!picker) continue;

    switch (box.LootBox.lootType) {
      case "heal": {
        // A healer's own heal box heals them fully, not the usual flat amount. The popup shows
        // what was ACTUALLY restored (the missing HP, if that's less than the box would normally
        // give), not a flat "+50"/"+max" that could overstate it.
        const healerFullHeal = PLAYER_CLASS_CATALOG[picker.PlayerClass.playerClass].healBoxFullHeal;
        const before = picker.Health.current;
        picker.Health.current = healerFullHeal
          ? picker.Health.max
          : Math.min(picker.Health.max, picker.Health.current + HEAL_BOX_AMOUNT);
        const healed = picker.Health.current - before;
        sendToInGamePlayers(network, {
          type: "heal",
          id: picker.id,
          health: { current: picker.Health.current, max: picker.Health.max },
        });
        // Same floating popup the zombie coin drop uses, just green and "+HP" instead of gold.
        sendToInGamePlayers(network, {
          type: "loot",
          position: { x: box.Position.x, y: box.Position.y },
          amount: healed,
          text: `+${healed} HP`,
          color: "#4CAF50",
        });
        break;
      }
      case "gold": {
        if (money) {
          money.amount += GOLD_BOX_AMOUNT;
          sendToInGamePlayers(network, { type: "money", amount: money.amount });
        }
        // Same floating "+amount" popup the zombie coin drop itself uses.
        sendToInGamePlayers(network, {
          type: "loot",
          position: { x: box.Position.x, y: box.Position.y },
          amount: GOLD_BOX_AMOUNT,
        });
        break;
      }
      case "ammo": {
        // Reserve for every owned weapon type, not just the equipped one - "refilling all weapon
        // store of bullets" per the request.
        for (const owned of picker.WeaponInventory.owned) {
          const catalog = WEAPON_CATALOG[owned.weaponType];
          if (!catalog.infiniteReserve) owned.reserveAmmo = catalog.maxReserve;
        }
        // Top off the equipped magazine too, and broadcast the same "ammo" packet shape
        // weapon.system.ts already uses - ammo-packet.handler.ts needs no changes.
        const weaponType = picker.WeaponInventory.equippedWeaponType;
        const state = picker.WeaponInventory.state;
        if (weaponType && state) {
          const catalog = WEAPON_CATALOG[weaponType];
          state.magazineAmmo = catalog.magazineSize;
          const owned = picker.WeaponInventory.owned.find((w) => w.weaponType === weaponType);
          sendToInGamePlayers(network, {
            type: "ammo",
            id: picker.id,
            weaponType,
            magazineAmmo: state.magazineAmmo,
            reserveAmmo: owned?.reserveAmmo ?? -1,
          });
        }
        // Same floating popup, no numeric amount to show (a magazine refill isn't a quantity the
        // way gold/HP are) - just what was picked up.
        sendToInGamePlayers(network, {
          type: "loot",
          position: { x: box.Position.x, y: box.Position.y },
          amount: 0,
          text: "Ammo refilled!",
          color: "#F5F2E9",
        });
        break;
      }
    }

    sendToInGamePlayers(network, { type: "kill", id: box.id });
    registry.killEntity(registry.entityFromIndex(box.id));
  }
}

// * Required to generate code
export default lootBoxPickupSystem.name;
