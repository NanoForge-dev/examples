import { type Registry } from "@nanoforge-dev/ecs-client";
import { type Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { Zombie } from "../components/zombie.component";
import { Health } from "../components/health.component";
import { Money } from "../components/money.component";
import { Position } from "../components/position.component";
import { Velocity } from "../components/velocity.component";
import { sendToInGamePlayers } from "../network-utils";

// ~7 frames at the zombie sprite's existing frameRate of 7 (see sprite.system.ts) - long enough
// for the death animation (zombie-animations.txt's "death" key) to actually play out client-side
// before the entity is removed.
const DEATH_ANIM_SECONDS = 1;

// Splits a zombie's death into two moments: the instant its Health hits 0 (coins awarded, loot
// text + "dying" animation triggered - see zombie-state-packet.handler.ts) and, DEATH_ANIM_SECONDS
// later, the actual removal (killEntity + "kill" broadcast) - exactly like Weapon.reloadRemaining
// already delays a reload finishing. A zombie that dies from any future damage source (not just
// bullets) is picked up here automatically.
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

    // Zeroed before broadcasting, same reasoning zombie-ai.ts's own attack transition documents -
    // a nonzero velocity left on a "dying" zombie keeps getting dead-reckoned by moveSystem and
    // the client for the whole animation, dragging the corpse across the map.
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
    // Sent now, at the killing blow, not after the corpse finishes falling - the reward should
    // appear the instant the player earns it.
    sendToInGamePlayers(network, {
      type: "loot",
      position: { x: zombie.Position.x, y: zombie.Position.y },
      amount: zombie.Zombie.coinValue,
    });
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
