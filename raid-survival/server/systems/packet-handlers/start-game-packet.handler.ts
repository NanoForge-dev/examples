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
import { Hitbox } from "../../components/hitbox.component";
import { Lobby } from "../../components/lobby.component";
import { Health } from "../../components/health.component";
import { Zombie } from "../../components/zombie.component";
import { IAComponent } from "../../components/ia.component";
import { WaveState } from "../../components/wave-state.component";
import { Money } from "../../components/money.component";
import { MoveInput } from "../../components/move-input.component";
import { Weapon } from "../../components/weapon.component";
import { ShootInput } from "../../components/shoot-input.component";
import { WEAPON_CATALOG } from "../../weapon-catalog";
import { createZombieBehavior, ZOMBIE_MAX_HEALTH } from "../zombie-ai";
import { Vector2d } from "@nanoforge-dev/graphics-2d";
import mapCollisionData from "../../static/map-collision.json";

const MAX_PLAYERS = 4;

const LOBBY_MAX_HEALTH = 500;
const PLAYER_MAX_HEALTH = 100;
const STARTING_MONEY = 150;
const STARTING_WEAPON_TYPE = "smallGun";

const MAP_CENTER: Vector2d = {
  x: (mapCollisionData.cols * mapCollisionData.tileSize) / 2,
  y: (mapCollisionData.rows * mapCollisionData.tileSize) / 2,
};

const PLAYER_COLLISION_BOX: Vector2d = { x: 24, y: 24 };
// Slightly smaller than the collision box and centered inside it, per design: the hitbox
// (combat range - what zombies attack) is a different concept from the collision box
// (physical blocking).
const PLAYER_HITBOX_SIZE: Vector2d = { x: 20, y: 20 };
const PLAYER_HITBOX_OFFSET: Vector2d = {
  x: (PLAYER_COLLISION_BOX.x - PLAYER_HITBOX_SIZE.x) / 2,
  y: (PLAYER_COLLISION_BOX.y - PLAYER_HITBOX_SIZE.y) / 2,
};

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

// Combat footprint used for zombie-vs-target range checks (zombie-ai.ts) - Position is its
// top-left, same convention as everything else.
const ZOMBIE_HITBOX: Vector2d = { x: 24, y: 24 };

// The only zombie type today - "punching zombies drop 10 coins" per design.
const ZOMBIE_COIN_VALUE = 10;

// Spawns a single zombie from a random tree cell, hunting via its own IAComponent. How many to
// spawn and when is entirely zombie-wave.system.ts's concern - this just knows how to spawn one.
export function spawnZombie(registry: Registry, network: NetworkServerLibrary, lobbyEntityId: number): void {
  const cell = mapTreeLocations[Math.floor(Math.random() * mapTreeLocations.length)];
  if (!cell) return;

  const position: Vector2d = {
    x: cell.x * mapCollisionData.tileSize + mapCollisionData.tileSize / 2,
    y: cell.y * mapCollisionData.tileSize + mapCollisionData.tileSize / 2,
  };

  const zombie = registry.spawnEntity();
  registry.addComponent(zombie, new Position(position.x, position.y));
  registry.addComponent(zombie, new Velocity(0, 0));
  registry.addComponent(zombie, new Direction(1, 0));
  registry.addComponent(zombie, new Health(ZOMBIE_MAX_HEALTH, ZOMBIE_MAX_HEALTH));
  registry.addComponent(zombie, new Hitbox(ZOMBIE_HITBOX.x, ZOMBIE_HITBOX.y));
  registry.addComponent(zombie, new Zombie(ZOMBIE_COIN_VALUE));
  registry.addComponent(zombie, new IAComponent(createZombieBehavior(lobbyEntityId)));

  sendToInGamePlayers(network, {
    type: "spawn",
    entityType: "zombie",
    id: zombie.getId(),
    position,
    velocity: { x: 0, y: 0 },
    direction: { x: 1, y: 0 },
    health: { current: ZOMBIE_MAX_HEALTH, max: ZOMBIE_MAX_HEALTH },
  });
}

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
  // Same size as the collision box - zombies attack this, not the collision box.
  registry.addComponent(lobby, new Hitbox(LOBBY_COLLISION_BOX.x, LOBBY_COLLISION_BOX.y));
  registry.addComponent(lobby, new Health(LOBBY_MAX_HEALTH, LOBBY_MAX_HEALTH));
  registry.addComponent(lobby, new Lobby());

  const playersInformation: {
    id: number;
    username: string;
    position: Vector2d;
    health: { current: number; max: number };
    weapon: { weaponType: string; magazineAmmo: number; reserveAmmo: number };
  }[] = [];

  const startingWeaponCatalog = WEAPON_CATALOG[STARTING_WEAPON_TYPE];

  clients.forEach((client, index) => {
    if (index >= MAX_PLAYERS) return;
    if (!PLAYERS_SPAWNERS[index]) return;

    const player = registry.entityFromIndex(client.entityId);

    client.entityId = player.getId();
    registry.addComponent(player, new Direction(1, 0));
    registry.addComponent(player, new Login(client.username));
    registry.addComponent(player, new Position(PLAYERS_SPAWNERS[index].x, PLAYERS_SPAWNERS[index].y));
    registry.addComponent(player, new Velocity(0, 0));
    registry.addComponent(player, new MoveInput());
    registry.addComponent(player, new CollisionBox(PLAYER_COLLISION_BOX.x, PLAYER_COLLISION_BOX.y));
    registry.addComponent(
      player,
      new Hitbox(PLAYER_HITBOX_SIZE.x, PLAYER_HITBOX_SIZE.y, PLAYER_HITBOX_OFFSET.x, PLAYER_HITBOX_OFFSET.y),
    );
    registry.addComponent(player, new Health(PLAYER_MAX_HEALTH, PLAYER_MAX_HEALTH));
    const startingAmmo = {
      magazineAmmo: startingWeaponCatalog.magazineSize,
      reserveAmmo: startingWeaponCatalog.infiniteReserve ? -1 : 0,
    };
    registry.addComponent(
      player,
      new Weapon(STARTING_WEAPON_TYPE, startingAmmo.magazineAmmo, startingAmmo.reserveAmmo),
    );
    registry.addComponent(player, new ShootInput());
    playersInformation.push({
      id: client.entityId,
      username: client.username,
      position: PLAYERS_SPAWNERS[index],
      health: { current: PLAYER_MAX_HEALTH, max: PLAYER_MAX_HEALTH },
      weapon: { weaponType: STARTING_WEAPON_TYPE, ...startingAmmo },
    });
  });

  const money = registry.spawnEntity();
  registry.addComponent(money, new Money(STARTING_MONEY));

  sendToInGamePlayers(network, {
    type: "startGame",
    players: playersInformation,
    lobby: {
      id: lobby.getId(),
      position: LOBBY_POSITION,
      health: { current: LOBBY_MAX_HEALTH, max: LOBBY_MAX_HEALTH },
    },
    money: STARTING_MONEY,
  });

  // Zombie spawning from here on is entirely driven by zombie-wave.system.ts, ticking off this
  // singleton state entity - see server/static/zombie-waves.txt for the wave config.
  const waveState = registry.spawnEntity();
  registry.addComponent(waveState, new WaveState(lobby.getId()));
}
