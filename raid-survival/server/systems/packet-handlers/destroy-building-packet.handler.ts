import { Registry } from "@nanoforge-dev/ecs-client";
import { Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { gameStatus, GameStatusEnum } from "../../main";
import { sendToInGamePlayers } from "../../network-utils";
import { Building } from "../../components/building.component";
import { Tower } from "../../components/tower.component";
import { Health } from "../../components/health.component";
import { Money } from "../../components/money.component";
import { BUILDING_CATALOG } from "../../building-catalog";
import { TOWER_UPGRADE_COST } from "../tower.system";

const REFUND_FRACTION = 0.5;

// A tower's value grows with every upgrade paid for; a wall's value is just its build cost.
function buildingValue(building: Building, tower: Tower | undefined): number {
  const baseCost = BUILDING_CATALOG[building.buildingType].cost;
  if (!tower) return baseCost;
  return baseCost + TOWER_UPGRADE_COST * (tower.level - 1);
}

// Removes a player-built wall/tower, refunding half its value. Not ownership-gated - buildings
// are a shared team asset.
export function destroyBuildingPacketHandler(
  _clientId: number,
  packet: any,
  registry: Registry,
  ctx: Context,
): void {
  if (gameStatus.status !== GameStatusEnum.InGame) return;

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

  const moneyEntities: { Money: Money }[] = registry.getZipper([Money]);
  const money = moneyEntities[0]?.Money;
  if (money) money.amount += refund;

  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  sendToInGamePlayers(network, { type: "kill", id });
  if (money) sendToInGamePlayers(network, { type: "money", amount: money.amount });
  registry.killEntity(entity);
}
