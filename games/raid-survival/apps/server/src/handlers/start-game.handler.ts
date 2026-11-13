import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";
import { MAP_COLS, MAP_ROWS, TILE_SIZE, TREE_LOCATIONS } from "@raid-survival/shared/map";
import { classForSkin, PLAYER_CLASS_CATALOG } from "@raid-survival/shared/player-class-catalog";
import type { ClientMessageOf, StartingPlayer, Vector } from "@raid-survival/shared/protocol";
import { WEAPON_CATALOG, type WeaponType } from "@raid-survival/shared/weapon-catalog";

import { broadcast } from "../broadcast";
import { CollisionBox } from "../components/collision-box.component";
import { Direction } from "../components/direction.component";
import { Health } from "../components/health.component";
import { Hitbox } from "../components/hitbox.component";
import { Lobby } from "../components/lobby.component";
import { Login } from "../components/login.component";
import { MapCollisions } from "../components/map-collisions.component";
import { Money } from "../components/money.component";
import { MoveInput } from "../components/move-input.component";
import { PlayerClass as PlayerClassComponent } from "../components/player-class.component";
import { Position2D } from "../components/position-2d.component";
import { ReviveInput } from "../components/revive-input.component";
import { ShootInput } from "../components/shoot-input.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { WaveState } from "../components/wave-state.component";
import { WeaponInventory, type OwnedWeapon } from "../components/weapon-inventory.component";
import { clientOf, gameState, lobbyClients } from "../queries";

const MAX_PLAYERS = 4;

const LOBBY_MAX_HEALTH = 500;
const STARTING_MONEY = 150;
const STARTING_WEAPON_TYPE: WeaponType = "smallGun";

const MAP_CENTER: Vector = {
  x: (MAP_COLS * TILE_SIZE) / 2,
  y: (MAP_ROWS * TILE_SIZE) / 2,
};

const PLAYER_COLLISION_BOX: Vector = { x: 24, y: 24 };
// Slightly smaller than the collision box and centered inside it - Hitbox (combat range) is a
// different concept from CollisionBox (physical blocking).
const PLAYER_HITBOX_SIZE: Vector = { x: 20, y: 20 };
const PLAYER_HITBOX_OFFSET: Vector = {
  x: (PLAYER_COLLISION_BOX.x - PLAYER_HITBOX_SIZE.x) / 2,
  y: (PLAYER_COLLISION_BOX.y - PLAYER_HITBOX_SIZE.y) / 2,
};

const LOBBY_SPRITE_SIZE: Vector = { x: 187, y: 143 };

const tilesFor = (size: number) => Math.ceil(size / TILE_SIZE) * TILE_SIZE;
const LOBBY_COLLISION_BOX: Vector = {
  x: tilesFor(LOBBY_SPRITE_SIZE.x),
  y: tilesFor(LOBBY_SPRITE_SIZE.y),
};

const LOBBY_POSITION: Vector = {
  x: MAP_CENTER.x - LOBBY_COLLISION_BOX.x / 2,
  y: MAP_CENTER.y - LOBBY_COLLISION_BOX.y / 2,
};

const PLAYER_SPAWN_CENTER_OFFSET =
  LOBBY_COLLISION_BOX.x / 2 + PLAYER_COLLISION_BOX.x / 2 + TILE_SIZE;
const PLAYER_SPAWN_CENTERS: Vector[] = [
  { x: MAP_CENTER.x - PLAYER_SPAWN_CENTER_OFFSET, y: MAP_CENTER.y - PLAYER_SPAWN_CENTER_OFFSET },
  { x: MAP_CENTER.x + PLAYER_SPAWN_CENTER_OFFSET, y: MAP_CENTER.y - PLAYER_SPAWN_CENTER_OFFSET },
  { x: MAP_CENTER.x - PLAYER_SPAWN_CENTER_OFFSET, y: MAP_CENTER.y + PLAYER_SPAWN_CENTER_OFFSET },
  { x: MAP_CENTER.x + PLAYER_SPAWN_CENTER_OFFSET, y: MAP_CENTER.y + PLAYER_SPAWN_CENTER_OFFSET },
];
const PLAYERS_SPAWNERS: Vector[] = PLAYER_SPAWN_CENTERS.map((center) => ({
  x: center.x - PLAYER_COLLISION_BOX.x / 2,
  y: center.y - PLAYER_COLLISION_BOX.y / 2,
}));

export const startGameHandler = (
  clientId: string,
  _packet: ClientMessageOf<"startGame">,
  registry: Registry,
  ctx: Context,
): void => {
  const state = gameState(registry);
  // Only a player of the lobby starts a game, and never while one runs.
  if (!state || state.status === "inGame" || !clientOf(registry, clientId)) return;
  state.status = "inGame";

  const map = registry.spawnEntity();
  registry.addComponent(map, new MapCollisions(TILE_SIZE, MAP_COLS, MAP_ROWS, TREE_LOCATIONS));

  const lobby = registry.spawnEntity();
  registry.addComponent(lobby, new Position2D(LOBBY_POSITION.x, LOBBY_POSITION.y));
  registry.addComponent(lobby, new CollisionBox(LOBBY_COLLISION_BOX.x, LOBBY_COLLISION_BOX.y));
  // Same size as the collision box - zombies attack this, not the collision box.
  registry.addComponent(lobby, new Hitbox(LOBBY_COLLISION_BOX.x, LOBBY_COLLISION_BOX.y));
  registry.addComponent(lobby, new Health(LOBBY_MAX_HEALTH, LOBBY_MAX_HEALTH));
  registry.addComponent(lobby, new Lobby());

  const playersInformation: StartingPlayer[] = [];

  lobbyClients(registry).forEach(({ id, Client: client }, index) => {
    const spawner = PLAYERS_SPAWNERS[index];
    if (index >= MAX_PLAYERS || !spawner) return;

    const player = registry.entityFromIndex(id);
    registry.addComponent(player, new Direction(1, 0));
    registry.addComponent(player, new Login(client.username));
    registry.addComponent(player, new Position2D(spawner.x, spawner.y));
    registry.addComponent(player, new Velocity2D(0, 0));
    registry.addComponent(player, new MoveInput());
    registry.addComponent(player, new CollisionBox(PLAYER_COLLISION_BOX.x, PLAYER_COLLISION_BOX.y));
    registry.addComponent(
      player,
      new Hitbox(
        PLAYER_HITBOX_SIZE.x,
        PLAYER_HITBOX_SIZE.y,
        PLAYER_HITBOX_OFFSET.x,
        PLAYER_HITBOX_OFFSET.y,
      ),
    );
    // Class is derived entirely from the chosen skin (see player-class-catalog.ts) - no separate
    // class-selection UI, the skin picker IS the class picker.
    const playerClass = classForSkin(client.skin);
    const classCatalog = PLAYER_CLASS_CATALOG[playerClass];
    const maxHealth = classCatalog.maxHealth;
    registry.addComponent(player, new Health(maxHealth, maxHealth));
    registry.addComponent(player, new PlayerClassComponent(playerClass));

    // Every player starts owning and equipping smallGun, except a fighter, who starts with a
    // shotgun instead.
    const startingWeaponType = playerClass === "fighter" ? "shotgun" : STARTING_WEAPON_TYPE;
    const startingCatalog = WEAPON_CATALOG[startingWeaponType];
    const startingWeapon: OwnedWeapon = {
      weaponType: startingWeaponType,
      reserveAmmo: startingCatalog.infiniteReserve
        ? startingCatalog.startingReserve
        : startingCatalog.magazineSize,
    };
    const inventory = new WeaponInventory();
    inventory.owned.push(startingWeapon);
    inventory.equippedWeaponType = startingWeaponType;
    inventory.state = {
      magazineAmmo: startingCatalog.magazineSize,
      state: "idle",
      reloadRemaining: 0,
      cooldownRemaining: 0,
    };
    registry.addComponent(player, inventory);
    registry.addComponent(player, new ShootInput());
    registry.addComponent(player, new ReviveInput());
    playersInformation.push({
      id,
      username: client.username,
      skin: client.skin,
      position: spawner,
      health: { current: maxHealth, max: maxHealth },
      weapons: [{ weaponType: startingWeapon.weaponType, reserveAmmo: startingWeapon.reserveAmmo }],
      weaponType: inventory.equippedWeaponType,
      magazineAmmo: inventory.state.magazineAmmo,
    });
  });

  const money = registry.spawnEntity();
  registry.addComponent(money, new Money(STARTING_MONEY));

  broadcast(ctx, {
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
  // singleton state entity - see zombie-waves.ts for the wave config.
  const waveState = registry.spawnEntity();
  registry.addComponent(waveState, new WaveState(lobby.getId()));
};
