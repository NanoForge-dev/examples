import { Registry } from "@nanoforge-dev/ecs-client";
import { Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { gameStatus, GameStatusEnum } from "../../main";
import { sendToInGamePlayers } from "../../network-utils";
import { Position } from "../../components/position.component";
import { CollisionBox } from "../../components/collision-box.component";
import { Hitbox } from "../../components/hitbox.component";
import { Health } from "../../components/health.component";
import { Building } from "../../components/building.component";
import { Money } from "../../components/money.component";
import { MapCollisions } from "../../components/map-collisions.component";
import { Lobby } from "../../components/lobby.component";
import { BUILDING_CATALOG, canPlaceBuilding, isBuildingType, type OccupiedBox } from "../../building-catalog";

function reject(network: NetworkServerLibrary, clientId: number, reason: string): void {
  network.tcp.sendToClient(
    clientId,
    new TextEncoder().encode(JSON.stringify({ type: "build", result: "rejected", reason })),
  );
}

export function buildPacketHandler(clientId: number, packet: any, registry: Registry, ctx: Context): void {
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

  const lobbies: { Position: Position; CollisionBox: CollisionBox }[] = registry.getZipper([
    Lobby,
    Position,
    CollisionBox,
  ]);
  const existingBuildings: { Position: Position; CollisionBox: CollisionBox }[] = registry.getZipper([
    Building,
    Position,
    CollisionBox,
  ]);

  const obstacles: OccupiedBox[] = [...lobbies, ...existingBuildings].map(({ Position, CollisionBox }) => ({
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
  );
  if (!canPlace) return reject(network, clientId, "tile unavailable");

  money.amount -= catalogEntry.cost;

  const position = { x: tileX * map.tileSize, y: tileY * map.tileSize };
  const building = registry.spawnEntity();
  registry.addComponent(building, new Position(position.x, position.y));
  registry.addComponent(building, new CollisionBox(map.tileSize, map.tileSize));
  registry.addComponent(building, new Hitbox(map.tileSize, map.tileSize));
  registry.addComponent(building, new Health(catalogEntry.maxHealth, catalogEntry.maxHealth));
  registry.addComponent(building, new Building(buildingType));

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
