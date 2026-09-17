import { type Registry } from "@nanoforge-dev/ecs-client";
import { type Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { Zombie } from "../components/zombie.component";
import { Health } from "../components/health.component";
import { Money } from "../components/money.component";
import { Position } from "../components/position.component";
import { Velocity } from "../components/velocity.component";
import { LootBox, type LootType } from "../components/loot-box.component";
import { Hitbox } from "../components/hitbox.component";
import { sendToInGamePlayers } from "../network-utils";

const LOOT_BOX_DROP_CHANCE = 1 / 20;
const LOOT_TYPES: LootType[] = ["heal", "gold", "ammo"];
// Matches the box's rendered sprite (objects.png's 15x12 loot icons).
const LOOT_BOX_HITBOX: [number, number] = [15, 12];

// Long enough for the "death" animation to play out client-side before the entity is removed.
const DEATH_ANIM_SECONDS = 1;

// Splits a zombie's death into two moments: the instant its Health hits 0 (coins/loot awarded,
// "dying" animation triggered) and, DEATH_ANIM_SECONDS later, the actual removal.
export function zombieDeathSystem(registry: Registry, ctx: Context) {
  const zombies: {
    id: number;
    Zombie: Zombie;
    Health: Health;
    Position: Position;
    Velocity: Velocity;
  }[] = registry.getIndexedZipper([Zombie, Health, Position, Velocity]);
  if (zombies.length === 0) return;

  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
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
    zombie.Velocity.x = 0;
    zombie.Velocity.y = 0;

    sendToInGamePlayers(network, {
      type: "zombieState",
      id: zombie.id,
      state: "dying",
      position: { x: zombie.Position.x, y: zombie.Position.y },
      velocity: { x: 0, y: 0 },
    });

    if (money) {
      money.amount += zombie.Zombie.coinValue;
      moneyChanged = true;
    }
    sendToInGamePlayers(network, {
      type: "loot",
      position: { x: zombie.Position.x, y: zombie.Position.y },
      amount: zombie.Zombie.coinValue,
    });

    // A chance per kill to also drop a physical loot box, separate from the coin reward above.
    if (Math.random() < LOOT_BOX_DROP_CHANCE) {
      const lootType = LOOT_TYPES[Math.floor(Math.random() * LOOT_TYPES.length)] ?? "gold";
      const lootBox = registry.spawnEntity();
      registry.addComponent(lootBox, new Position(zombie.Position.x, zombie.Position.y));
      registry.addComponent(lootBox, new Hitbox(...LOOT_BOX_HITBOX));
      registry.addComponent(lootBox, new LootBox(lootType));
      sendToInGamePlayers(network, {
        type: "spawn",
        entityType: "lootBox",
        id: lootBox.getId(),
        lootType,
        position: { x: zombie.Position.x, y: zombie.Position.y },
      });
    }
  }

  for (const zombie of readyToRemove) {
    sendToInGamePlayers(network, { type: "kill", id: zombie.id });
    registry.killEntity(registry.entityFromIndex(zombie.id));
  }

  if (moneyChanged && money) {
    sendToInGamePlayers(network, { type: "money", amount: money.amount });
  }
}

// * Required to generate code
export default zombieDeathSystem.name;
