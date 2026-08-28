import { Registry } from "@nanoforge-dev/ecs-client";
import { clients, gameStatus, GameStatusEnum } from "../../main";
import { Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";
import { sendToInGamePlayers } from "../../network-utils";
import { Position } from "../../components/position.component";
import { Direction } from "../../components/direction.component";
import { Velocity } from "../../components/velocity.component";
import { Login } from "../../components/login.component";
import { MapCollisions, TreeLocation } from "../../components/map-collisions.component";
import { CollisionBox } from "../../components/collision-box.component";
import { Lobby } from "../../components/lobby.component";
import { Health } from "../../components/health.component";
import { Vector2d } from "@nanoforge-dev/graphics-2d";
import mapCollisionData from "../../static/map-collision.json";

const MAX_PLAYERS = 4;

const LOBBY_MAX_HEALTH = 500;
const PLAYER_MAX_HEALTH = 100;

const MAP_CENTER: Vector2d = {
  x: (mapCollisionData.cols * mapCollisionData.tileSize) / 2,
  y: (mapCollisionData.rows * mapCollisionData.tileSize) / 2,
};

const PLAYER_COLLISION_BOX: Vector2d = { x: 24, y: 24 };

const LOBBY_SPRITE_SIZE: Vector2d = { x: 187, y: 143 };

const tilesFor = (size: number) => Math.ceil(size / mapCollisionData.tileSize) * mapCollisionData.tileSize;
const LOBBY_COLLISION_BOX: Vector2d = {
  x: tilesFor(LOBBY_SPRITE_SIZE.x),
  y: tilesFor(LOBBY_SPRITE_SIZE.y),
};

const LOBBY_POSITION: Vector2d = {
  x: MAP_CENTER.x - LOBBY_COLLISION_BOX.x / 2,
  y: MAP_CENTER.y - LOBBY_COLLISION_BOX.y / 2,
};

const PLAYER_SPAWN_CENTER_OFFSET =
  LOBBY_COLLISION_BOX.x / 2 + PLAYER_COLLISION_BOX.x / 2 + mapCollisionData.tileSize;
const PLAYER_SPAWN_CENTERS: Vector2d[] = [
  { x: MAP_CENTER.x - PLAYER_SPAWN_CENTER_OFFSET, y: MAP_CENTER.y - PLAYER_SPAWN_CENTER_OFFSET },
  { x: MAP_CENTER.x + PLAYER_SPAWN_CENTER_OFFSET, y: MAP_CENTER.y - PLAYER_SPAWN_CENTER_OFFSET },
  { x: MAP_CENTER.x - PLAYER_SPAWN_CENTER_OFFSET, y: MAP_CENTER.y + PLAYER_SPAWN_CENTER_OFFSET },
  { x: MAP_CENTER.x + PLAYER_SPAWN_CENTER_OFFSET, y: MAP_CENTER.y + PLAYER_SPAWN_CENTER_OFFSET },
];
const PLAYERS_SPAWNERS: Vector2d[] = PLAYER_SPAWN_CENTERS.map((center) => ({
  x: center.x - PLAYER_COLLISION_BOX.x / 2,
  y: center.y - PLAYER_COLLISION_BOX.y / 2,
}));

const mapTreeLocations: TreeLocation[] = mapCollisionData.collision.flatMap((row, y) =>
  row.flatMap((blocked, x) => (blocked ? [{ x, y }] : [])),
);

export function startGamePacketHandler(
  _clientId: number,
  _packet: any,
  registry: Registry,
  ctx: Context,
): void {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  if (gameStatus.status === GameStatusEnum.InGame) return;
  gameStatus.status = GameStatusEnum.InGame;

  const map = registry.spawnEntity();
  registry.addComponent(
    map,
    new MapCollisions(mapCollisionData.tileSize, mapCollisionData.cols, mapCollisionData.rows, mapTreeLocations),
  );

  const lobby = registry.spawnEntity();
  registry.addComponent(lobby, new Position(LOBBY_POSITION.x, LOBBY_POSITION.y));
  registry.addComponent(lobby, new CollisionBox(LOBBY_COLLISION_BOX.x, LOBBY_COLLISION_BOX.y));
  registry.addComponent(lobby, new Health(LOBBY_MAX_HEALTH, LOBBY_MAX_HEALTH));
  registry.addComponent(lobby, new Lobby());

  const playersInformation: {
    id: number;
    username: string;
    position: Vector2d;
    health: { current: number; max: number };
  }[] = [];

  clients.forEach((client, index) => {
    if (index >= MAX_PLAYERS) return;
    if (!PLAYERS_SPAWNERS[index]) return;

    const player = registry.entityFromIndex(client.entityId);

    client.entityId = player.getId();
    registry.addComponent(player, new Direction(1, 0));
    registry.addComponent(player, new Login(client.username));
    registry.addComponent(player, new Position(PLAYERS_SPAWNERS[index].x, PLAYERS_SPAWNERS[index].y));
    registry.addComponent(player, new Velocity(0, 0));
    registry.addComponent(player, new CollisionBox(PLAYER_COLLISION_BOX.x, PLAYER_COLLISION_BOX.y));
    registry.addComponent(player, new Health(PLAYER_MAX_HEALTH, PLAYER_MAX_HEALTH));
    playersInformation.push({
      id: client.entityId,
      username: client.username,
      position: PLAYERS_SPAWNERS[index],
      health: { current: PLAYER_MAX_HEALTH, max: PLAYER_MAX_HEALTH },
    });
  });

  sendToInGamePlayers(network, {
    type: "startGame",
    players: playersInformation,
    lobby: {
      id: lobby.getId(),
      position: LOBBY_POSITION,
      health: { current: LOBBY_MAX_HEALTH, max: LOBBY_MAX_HEALTH },
    },
  });
}
