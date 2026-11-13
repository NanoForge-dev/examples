import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";
import type { LootType } from "@raid-survival/shared/protocol";

import { broadcast } from "../broadcast";
import { Health } from "../components/health.component";
import { Hitbox } from "../components/hitbox.component";
import { LootBox } from "../components/loot-box.component";
import { Money } from "../components/money.component";
import { Position2D } from "../components/position-2d.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { Zombie } from "../components/zombie.component";

const LOOT_BOX_DROP_CHANCE = 1 / 20;
const LOOT_TYPES: LootType[] = ["heal", "gold", "ammo"];
// Matches the box's rendered sprite (objects.png's 15x12 loot icons).
const LOOT_BOX_HITBOX: [number, number] = [15, 12];

// Long enough for the "death" animation to play out client-side before the entity is removed.
const DEATH_ANIM_SECONDS = 1;

/**
 * Splits a zombie's death into two moments: the instant its Health hits 0 (coins/loot awarded,
 * "dying" animation triggered) and, DEATH_ANIM_SECONDS later, the actual removal.
 *
 * @system
 * @side server
 */
export const zombieDeathSystem = (registry: Registry, ctx: Context) => {
  const zombies: {
    id: number;
    Zombie: Zombie;
    Health: Health;
    Position2D: Position2D;
    Velocity2D: Velocity2D;
  }[] = registry.getIndexedZipper([Zombie, Health, Position2D, Velocity2D]);
  if (zombies.length === 0) return;
  const delta = ctx.app.delta / 1000;

  const moneyEntities: { Money: Money }[] = registry.getZipper([Money]);
  const money = moneyEntities[0]?.Money;
  let moneyChanged = false;

  const readyToRemove: typeof zombies = [];

  for (const zombie of zombies) {
    if (zombie.Zombie.dying) {
      zombie.Zombie.dyingRemaining -= delta;
      if (zombie.Zombie.dyingRemaining <= 0) {
        readyToRemove.push(zombie);
      }
      continue;
    }

    if (zombie.Health.current > 0) continue;

    // Just died this tick - start the animation window instead of removing it immediately.
    zombie.Zombie.dying = true;
    zombie.Zombie.dyingRemaining = DEATH_ANIM_SECONDS;

    // A nonzero velocity left on a "dying" zombie would keep dragging the corpse across the map.
    zombie.Velocity2D.x = 0;
    zombie.Velocity2D.y = 0;

    broadcast(ctx, {
      type: "zombieState",
      id: zombie.id,
      state: "dying",
      position: { x: zombie.Position2D.x, y: zombie.Position2D.y },
      velocity: { x: 0, y: 0 },
    });

    if (money) {
      money.amount += zombie.Zombie.coinValue;
      moneyChanged = true;
    }
    broadcast(ctx, {
      type: "loot",
      position: { x: zombie.Position2D.x, y: zombie.Position2D.y },
      amount: zombie.Zombie.coinValue,
    });

    // A chance per kill to also drop a physical loot box, separate from the coin reward above.
    if (Math.random() < LOOT_BOX_DROP_CHANCE) {
      const lootType = LOOT_TYPES[Math.floor(Math.random() * LOOT_TYPES.length)] ?? "gold";
      const lootBox = registry.spawnEntity();
      registry.addComponent(lootBox, new Position2D(zombie.Position2D.x, zombie.Position2D.y));
      registry.addComponent(lootBox, new Hitbox(...LOOT_BOX_HITBOX));
      registry.addComponent(lootBox, new LootBox(lootType));
      broadcast(ctx, {
        type: "spawn",
        entityType: "lootBox",
        id: lootBox.getId(),
        lootType,
        position: { x: zombie.Position2D.x, y: zombie.Position2D.y },
      });
    }
  }

  for (const zombie of readyToRemove) {
    broadcast(ctx, { type: "kill", id: zombie.id });
    registry.killEntity(registry.entityFromIndex(zombie.id));
  }

  if (moneyChanged && money) {
    broadcast(ctx, { type: "money", amount: money.amount });
  }
};
