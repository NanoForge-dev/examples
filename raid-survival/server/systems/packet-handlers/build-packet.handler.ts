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

// A tower's combat Hitbox (what zombies actually reach out and attack, zombie-ai.ts's
// ZOMBIE_ATTACK_RANGE) is deliberately smaller than its full 3x3 CollisionBox/placement
// footprint, centered within it - the same "Hitbox is a different, usually smaller, concept than
// CollisionBox" convention start-game-packet.handler.ts already uses for players
// (PLAYER_HITBOX_SIZE vs PLAYER_COLLISION_BOX). Using the full 48x48 footprint as the Hitbox too
// would let a zombie standing anywhere along that much bigger box's edge start attacking, making
// a freshly-built tower a much easier target than intended - a wall stays exempt (its Hitbox
// already equals its single-tile footprint, unchanged from before towers existed).
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

  // No mid-game-join-style leniency here: building only ever makes sense while a game is
  // actually running.
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

  // CollisionBox is specifically the "physical blocking" footprint (as opposed to Hitbox, which
  // is a combat range) - the lobby, every existing building, AND every player (dead or alive) all
  // carry one, so one generic query blocks placement on all three at once. Players are included
  // so a wall/tower can never be dropped on top of one - without this, a trapped player would
  // have no way to walk back out.
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
  // A tower's Hitbox is smaller than its full footprint (see TOWER_HITBOX_SIZE above); every
  // other building's (just "wall" today) stays equal to its own footprint, unchanged from
  // before towers existed.
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
  // tower.system.ts/tower-interact.system.ts only ever act on entities carrying this - a wall
  // never gets one, so it's forever unaffected by auto-fire/level-up.
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
