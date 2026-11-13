import type { Registry } from "@nanoforge-dev/ecs/server";
import type { Context } from "@nanoforge-dev/common";

import { Building } from "../components/building.component";
import { Health } from "../components/health.component";
import { broadcast } from "../broadcast";

/**
 * Removes a building once its HP hits 0, freeing its tile for handlers/build.handler.ts's
 * occupancy check and for zombies to walk through.
 *
 * @system
 * @side server
 */
export const buildingDeathSystem = (registry: Registry, ctx: Context) => {
  const buildings: { id: number; Health: Health }[] = registry.getIndexedZipper([Building, Health]);
  const dead = buildings.filter((b) => b.Health.current <= 0);
  if (dead.length === 0) return;
  for (const building of dead) {
    broadcast(ctx, { type: "kill", id: building.id });
    registry.killEntity(registry.entityFromIndex(building.id));
  }
};
