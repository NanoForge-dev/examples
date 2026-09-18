import { type Registry } from "@nanoforge-dev/ecs-client";
import { type Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { Building } from "../components/building.component";
import { Health } from "../components/health.component";
import { sendToInGamePlayers } from "../network-utils";

// Removes a building once its HP hits 0, freeing its tile for build-packet.handler.ts's
// occupancy check and for zombies to walk through.
export function buildingDeathSystem(registry: Registry, ctx: Context) {
  const buildings: { id: number; Health: Health }[] = registry.getIndexedZipper([Building, Health]);
  const dead = buildings.filter((b) => b.Health.current <= 0);
  if (dead.length === 0) return;

  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  for (const building of dead) {
    sendToInGamePlayers(network, { type: "kill", id: building.id });
    registry.killEntity(registry.entityFromIndex(building.id));
  }
}

// * Required to generate code
export default buildingDeathSystem.name;
