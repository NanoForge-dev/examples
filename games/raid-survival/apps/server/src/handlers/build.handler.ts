import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";
import {
  BUILDING_CATALOG,
  canPlaceBuilding,
  isBuildingType,
  type OccupiedBox,
} from "@raid-survival/shared/building-catalog";
import type { ClientMessageOf, Vector } from "@raid-survival/shared/protocol";

import { broadcast, sendTo } from "../broadcast";
import { Building } from "../components/building.component";
import { CollisionBox } from "../components/collision-box.component";
import { Health } from "../components/health.component";
import { Hitbox } from "../components/hitbox.component";
import { MapCollisions } from "../components/map-collisions.component";
import { Position2D } from "../components/position-2d.component";
import { Tower } from "../components/tower.component";
import { inGame, teamMoney } from "../queries";

const reject = (ctx: Context, clientId: string, reason: string): void =>
  sendTo(ctx, clientId, { type: "build", result: "rejected", reason });

// A tower's combat Hitbox (what zombies attack) is deliberately smaller than its full 3x3
// CollisionBox/placement footprint, centered within it - otherwise a zombie anywhere along the
// bigger box's edge could attack it, making a fresh tower an easier target than intended.
const TOWER_HITBOX_SIZE: Vector = { x: 24, y: 24 };

const towerHitboxOffset = (footprintWidth: number, footprintHeight: number): Vector => {
  return {
    x: (footprintWidth - TOWER_HITBOX_SIZE.x) / 2,
    y: (footprintHeight - TOWER_HITBOX_SIZE.y) / 2,
  };
};

export const buildHandler = (
  clientId: string,
  packet: ClientMessageOf<"build">,
  registry: Registry,
  ctx: Context,
): void => {
  if (!inGame(registry)) return;

  const buildingType = packet.buildingType;
  if (!isBuildingType(buildingType)) return reject(ctx, clientId, "unknown building type");

  const tileX = packet.tileX;
  const tileY = packet.tileY;
  if (typeof tileX !== "number" || typeof tileY !== "number") return;

  const catalogEntry = BUILDING_CATALOG[buildingType];

  const maps: { MapCollisions: MapCollisions }[] = registry.getZipper([MapCollisions]);
  const map = maps[0]?.MapCollisions;
  if (!map) return;

  const money = teamMoney(registry);
  if (!money) return;

  if (money.amount < catalogEntry.cost) return reject(ctx, clientId, "not enough money");

  // The lobby, every building, and every player all carry a CollisionBox, so one generic query
  // blocks placement on all three - players are included so a wall/tower can't trap one in place.
  const obstacleEntities: { Position2D: Position2D; CollisionBox: CollisionBox }[] =
    registry.getZipper([Position2D, CollisionBox]);

  const obstacles: OccupiedBox[] = obstacleEntities.map(({ Position2D, CollisionBox }) => ({
    x: Position2D.x,
    y: Position2D.y,
    width: CollisionBox.width,
    height: CollisionBox.height,
  }));

  const canPlace = canPlaceBuilding(
    tileX,
    tileY,
    map.tileSize,
    map.cols,
    map.rows,
    (col, row) => map.isTreeCell(col, row),
    obstacles,
    catalogEntry.footprintTiles,
  );
  if (!canPlace) return reject(ctx, clientId, "tile unavailable");

  money.amount -= catalogEntry.cost;

  const position = { x: tileX * map.tileSize, y: tileY * map.tileSize };
  const footprintWidth = map.tileSize * catalogEntry.footprintTiles.width;
  const footprintHeight = map.tileSize * catalogEntry.footprintTiles.height;
  const building = registry.spawnEntity();
  registry.addComponent(building, new Position2D(position.x, position.y));
  registry.addComponent(building, new CollisionBox(footprintWidth, footprintHeight));
  // A tower's Hitbox is smaller than its full footprint (see TOWER_HITBOX_SIZE); a wall's equals
  // its own footprint.
  if (buildingType === "tower") {
    const offset = towerHitboxOffset(footprintWidth, footprintHeight);
    registry.addComponent(
      building,
      new Hitbox(TOWER_HITBOX_SIZE.x, TOWER_HITBOX_SIZE.y, offset.x, offset.y),
    );
  } else {
    registry.addComponent(building, new Hitbox(footprintWidth, footprintHeight));
  }
  registry.addComponent(building, new Health(catalogEntry.maxHealth, catalogEntry.maxHealth));
  registry.addComponent(building, new Building(buildingType));
  if (buildingType === "tower") {
    registry.addComponent(building, new Tower());
  }

  broadcast(ctx, {
    type: "spawn",
    entityType: "building",
    buildingType,
    id: building.getId(),
    position,
    health: { current: catalogEntry.maxHealth, max: catalogEntry.maxHealth },
  });

  broadcast(ctx, { type: "money", amount: money.amount });
};
