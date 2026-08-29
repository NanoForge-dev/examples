import { type Registry } from "@nanoforge-dev/ecs-client";
import { type Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { Zombie } from "../components/zombie.component";
import { Health } from "../components/health.component";
import { Money } from "../components/money.component";
import { sendToInGamePlayers } from "../network-utils";

// Nothing damages a zombie's own Health today (only players/the lobby take damage - see
// zombie-ai.ts), so this never fires yet. It's still real, generic infrastructure: the moment
// any future system reduces a zombie's Health to 0, this picks it up automatically - awards its
// coin value to the shared pool, removes it from both registries, and tells the client.
export function zombieDeathSystem(registry: Registry, ctx: Context) {
  const zombies: { id: number; Zombie: Zombie; Health: Health }[] = registry.getIndexedZipper([Zombie, Health]);
  const dead = zombies.filter((z) => z.Health.current <= 0);
  if (dead.length === 0) return;

  const moneyEntities: { Money: Money }[] = registry.getZipper([Money]);
  const money = moneyEntities[0]?.Money;

  const network = ctx.libs.getNetwork<NetworkServerLibrary>();

  for (const zombie of dead) {
    if (money) money.amount += zombie.Zombie.coinValue;
    sendToInGamePlayers(network, { type: "kill", id: zombie.id });
    registry.killEntity(registry.entityFromIndex(zombie.id));
  }

  if (money) {
    sendToInGamePlayers(network, { type: "money", amount: money.amount });
  }
}

// * Required to generate code
export default zombieDeathSystem.name;
