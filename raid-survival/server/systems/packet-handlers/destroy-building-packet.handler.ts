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

// A tower's value grows with every upgrade paid for (build-packet.handler.ts's cost, plus one
// TOWER_UPGRADE_COST per level above 1) - a wall never levels up, so its value is just its build
// cost.
function buildingValue(building: Building, tower: Tower | undefined): number {
  const baseCost = BUILDING_CATALOG[building.buildingType].cost;
  if (!tower) return baseCost;
  return baseCost + TOWER_UPGRADE_COST * (tower.level - 1);
}

// Removes a player-built wall/tower, refunding half its value (build cost, plus upgrades paid
// for a tower) - not ownership-gated, same as every other building action today (buildings are a
// shared team asset, not owned by whoever placed them).
export function destroyBuildingPacketHandler(
  _clientId: number,
  packet: any,
  registry: Registry,
  ctx: Context,
): void {
  if (gameStatus.status !== GameStatusEnum.InGame) return;

  const id = packet.id;
  if (typeof id !== "number") return;

  // `id` is client-supplied and can be stale by the time this packet is actually processed - the
  // building it named can have already died to zombies (building-death.system.ts, which runs
  // every tick, after this handler in main.ts's system order - see below) or been destroyed by
  // another player's click a moment earlier, in either case possibly before this packet arrived.
  // Resolving that stale id via registry.entityFromIndex()/getEntityComponent() directly (as this
  // used to) is what crashed the whole server (see the crash report this fixes:
  // "UnhandledPromiseRejection ... rejected with the reason '2010936'" - a building's own entity
  // id): the exact WASM-boundary mechanics aren't proven, but this is the one call site in the
  // whole codebase that resolves a client-supplied id with no liveness check first, and every
  // other packet handler here already avoids doing that. Confirming `id` against this tick's own
  // building zipper - the same safe pattern those other handlers use - closes that gap.
  //
  // Also excluding a building already at/below 0 HP: buildingDeathSystem is registered AFTER this
  // handler (main.ts), so it hasn't swept this tick's zombie-killed buildings yet when this runs -
  // meaning a building that died to zombies THIS SAME tick would still show up as "live" here. If
  // getIndexedZipper/killEntity turn out to defer removal even by one more tick than expected,
  // this keeps the two handlers from ever both trying to kill the same entity: buildingDeathSystem
  // stays the sole killer of HP-depleted buildings, this handler the sole killer of a
  // player-requested destroy on a still-healthy one - no overlap either way.
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
