import { Registry } from "@nanoforge-dev/ecs-client";
import { Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";
import { Vector2d } from "@nanoforge-dev/graphics-2d";

import { gameStatus, GameStatusEnum } from "../../main";
import { sendToInGamePlayers } from "../../network-utils";
import { Position } from "../../components/position.component";
import { CollisionBox } from "../../components/collision-box.component";
import { Hitbox } from "../../components/hitbox.component";
import { Health } from "../../components/health.component";
import { Building } from "../../components/building.component";
import { Tower } from "../../components/tower.component";
import { Money } from "../../components/money.component";
import { MapCollisions } from "../../components/map-collisions.component";
import {
  BUILDING_CATALOG,
  canPlaceBuilding,
  isBuildingType,
  type OccupiedBox,
} from "../../building-catalog";

function reject(network: NetworkServerLibrary, clientId: number, reason: string): void {
  network.tcp.sendToClient(
    clientId,
    new TextEncoder().encode(JSON.stringify({ type: "build", result: "rejected", reason })),
  );
}

// A tower's combat Hitbox (what zombies attack) is deliberately smaller than its full 3x3
// CollisionBox/placement footprint, centered within it - otherwise a zombie anywhere along the
// bigger box's edge could attack it, making a fresh tower an easier target than intended.
const TOWER_HITBOX_SIZE: Vector2d = { x: 24, y: 24 };

function towerHitboxOffset(footprintWidth: number, footprintHeight: number): Vector2d {
  return {
    x: (footprintWidth - TOWER_HITBOX_SIZE.x) / 2,
    y: (footprintHeight - TOWER_HITBOX_SIZE.y) / 2,
  };
}

export function buildPacketHandler(
  clientId: number,
  packet: any,
  registry: Registry,
  ctx: Context,
): void {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();

  if (gameStatus.status !== GameStatusEnum.InGame) return;

  const buildingType = packet.buildingType;
  if (!isBuildingType(buildingType)) return reject(network, clientId, "unknown building type");

  const tileX = packet.tileX;
  const tileY = packet.tileY;
  if (typeof tileX !== "number" || typeof tileY !== "number") return;

  const catalogEntry = BUILDING_CATALOG[buildingType];

  const maps: { MapCollisions: MapCollisions }[] = registry.getZipper([MapCollisions]);
  const map = maps[0]?.MapCollisions;
  if (!map) return;

  const moneyEntities: { Money: Money }[] = registry.getZipper([Money]);
  const money = moneyEntities[0]?.Money;
  if (!money) return;

  if (money.amount < catalogEntry.cost) return reject(network, clientId, "not enough money");

  // The lobby, every building, and every player all carry a CollisionBox, so one generic query
  // blocks placement on all three - players are included so a wall/tower can't trap one in place.
  const obstacleEntities: { Position: Position; CollisionBox: CollisionBox }[] = registry.getZipper(
    [Position, CollisionBox],
  );

  const obstacles: OccupiedBox[] = obstacleEntities.map(({ Position, CollisionBox }) => ({
    x: Position.x,
    y: Position.y,
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
  if (!canPlace) return reject(network, clientId, "tile unavailable");

  money.amount -= catalogEntry.cost;

  const position = { x: tileX * map.tileSize, y: tileY * map.tileSize };
  const footprintWidth = map.tileSize * catalogEntry.footprintTiles.width;
  const footprintHeight = map.tileSize * catalogEntry.footprintTiles.height;
  const building = registry.spawnEntity();
  registry.addComponent(building, new Position(position.x, position.y));
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

  sendToInGamePlayers(network, {
    type: "spawn",
    entityType: "building",
    buildingType,
    id: building.getId(),
    position,
    health: { current: catalogEntry.maxHealth, max: catalogEntry.maxHealth },
  });

  sendToInGamePlayers(network, { type: "money", amount: money.amount });
}
