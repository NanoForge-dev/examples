import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";
import { BUILDING_CATALOG } from "@raid-survival/shared/building-catalog";
import type { ClientMessageOf } from "@raid-survival/shared/protocol";
import { TOWER_UPGRADE_COST } from "@raid-survival/shared/tower";

import { broadcast } from "../broadcast";
import { Building } from "../components/building.component";
import { Health } from "../components/health.component";
import { Tower } from "../components/tower.component";
import { inGame, teamMoney } from "../queries";

const REFUND_FRACTION = 0.5;

// A tower's value grows with every upgrade paid for; a wall's value is just its build cost.
const buildingValue = (building: Building, tower: Tower | undefined): number => {
  const baseCost = BUILDING_CATALOG[building.buildingType].cost;
  if (!tower) return baseCost;
  return baseCost + TOWER_UPGRADE_COST * (tower.level - 1);
};

// Removes a player-built wall/tower, refunding half its value. Not ownership-gated - buildings
// are a shared team asset.
export const destroyBuildingHandler = (
  _clientId: string,
  packet: ClientMessageOf<"destroyBuilding">,
  registry: Registry,
  ctx: Context,
): void => {
  if (!inGame(registry)) return;

  const id = packet.id;
  if (typeof id !== "number") return;

  // `id` is client-supplied and can be stale (the building may have already died to zombies or
  // been destroyed by another player). Resolving a stale id directly, with no liveness check,
  // previously crashed the server - always validate against the current tick's live entities
  // first. Also excludes a building already at/below 0 HP so this never races
  // buildingDeathSystem, which runs later in the tick and owns removing HP-depleted buildings.
  const buildings: { id: number; Building: Building; Health: Health }[] = registry.getIndexedZipper(
    [Building, Health],
  );
  const live = buildings.find((b) => b.id === id);
  if (!live || live.Health.current <= 0) return; // not a building, already gone, or already dying

  const entity = registry.entityFromIndex(id);
  const building = live.Building;
  const tower = registry.getEntityComponent(entity, Tower) ?? undefined;
  const refund = Math.floor(buildingValue(building, tower) * REFUND_FRACTION);

  const money = teamMoney(registry);
  if (money) money.amount += refund;
  broadcast(ctx, { type: "kill", id });
  if (money) broadcast(ctx, { type: "money", amount: money.amount });
  registry.killEntity(entity);
};
