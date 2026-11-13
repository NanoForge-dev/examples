import { definePacket } from "@nanoforge-dev/network";

import type { BuildingType } from "./building-catalog";
import type { WeaponType } from "./weapon-catalog";

// Every message of the game. Each direction has one packet type carrying a `type` union, so the
// messages of a tick are handled in the order they were sent (a spawn before its kill, the start
// of a game before its first zombies). Ids are the server's entity ids.

export interface Vector {
  x: number;
  y: number;
}

export interface HealthValue {
  current: number;
  max: number;
}

export interface LobbyPlayer {
  id: number;
  username: string;
  skin: number;
}

export interface OwnedWeaponAmmo {
  weaponType: WeaponType;
  reserveAmmo: number;
}

export interface StartingPlayer extends LobbyPlayer {
  position: Vector;
  health: HealthValue;
  weapons: OwnedWeaponAmmo[];
  weaponType: WeaponType | null;
  magazineAmmo: number;
}

export type LootType = "heal" | "gold" | "ammo";

export type ZombieState = "idle" | "attack" | "dying";

/** What a client sends. The server checks every field: a client can send anything. */
export type ClientMessage =
  | { type: "joinLobby"; username: string; skin: number }
  | { type: "startGame" }
  | {
      type: "input";
      direction?: Vector;
      mousePosition?: Vector;
      moveKeys?: ("up" | "down" | "left" | "right")[];
      shooting?: boolean;
      reload?: boolean;
      reviveKeyHeld?: boolean;
      interactRequested?: boolean;
    }
  | { type: "build"; buildingType: BuildingType; tileX: number; tileY: number }
  | { type: "buyWeapon"; weaponType: WeaponType }
  | { type: "buyAmmo"; weaponType: WeaponType }
  | { type: "equipWeapon"; weaponType: WeaponType | null }
  | { type: "destroyBuilding"; id: number };

/** What the server sends. */
export type ServerMessage =
  | {
      type: "joinLobby";
      result: "success" | "full" | "in game" | "username taken";
      players?: LobbyPlayer[];
    }
  | { type: "lobbyInfo"; players: LobbyPlayer[] }
  | {
      type: "startGame";
      players: StartingPlayer[];
      lobby: { id: number; position: Vector; health: HealthValue };
      money: number;
    }
  | {
      type: "spawn";
      entityType: "building";
      buildingType: BuildingType;
      id: number;
      position: Vector;
      health: HealthValue;
    }
  | {
      type: "spawn";
      entityType: "zombie";
      id: number;
      position: Vector;
      velocity: Vector;
      direction: Vector;
      health: HealthValue;
    }
  | { type: "spawn"; entityType: "bullet"; id: number; position: Vector; velocity: Vector }
  | { type: "spawn"; entityType: "lootBox"; id: number; lootType: LootType; position: Vector }
  | { type: "move"; id: number; position: Vector; velocity: Vector }
  | { type: "direction"; id: number; direction: Vector }
  | { type: "kill"; id: number }
  | { type: "hit"; id: number; damage: number }
  | { type: "heal"; id: number; health: HealthValue }
  | { type: "towerUpdate"; id: number; level: number; health: HealthValue }
  | { type: "zombieState"; id: number; state: ZombieState; position: Vector; velocity: Vector }
  | {
      type: "waveInfo";
      wave: number;
      maxWaves: number;
      subWave: number;
      subWaveCount: number;
      aliveZombies: number;
      phase: "spawning" | "cooldown" | "finished";
      cooldownRemaining: number;
    }
  | { type: "money"; amount: number }
  | { type: "loot"; position: Vector; amount: number; text?: string; color?: string }
  | {
      type: "revive";
      state: "started";
      targetId: number;
      durationSeconds: number;
    }
  | { type: "revive"; state: "completed"; targetId: number; health: number }
  | { type: "revive"; state: "cancelled"; targetId: number }
  | {
      type: "weaponState";
      id: number;
      weaponType: WeaponType;
      state: "idle" | "reloading";
      reloadSeconds?: number;
    }
  | { type: "weaponFired"; id: number; weaponType: WeaponType }
  | {
      type: "ammo";
      id: number;
      weaponType: WeaponType;
      magazineAmmo: number;
      reserveAmmo: number;
    }
  | {
      type: "weaponInventory";
      id: number;
      weaponType: WeaponType | null;
      weapons: OwnedWeaponAmmo[];
    }
  | { type: "build" | "buyWeapon" | "buyAmmo" | "equipWeapon"; result: "rejected"; reason: string }
  | { type: "gameOver"; result: "victory" | "defeat"; zombiesKilled: number };

/** The `ServerMessage` of a type. */
export type ServerMessageOf<T extends ServerMessage["type"]> = Extract<ServerMessage, { type: T }>;

/** The `ClientMessage` of a type. */
export type ClientMessageOf<T extends ClientMessage["type"]> = Extract<ClientMessage, { type: T }>;

/** Client to server. Only the `type` is checked here: each handler checks its own fields. */
export const ClientPacket = definePacket<ClientMessage>("raid-client", {
  validate: (data): data is ClientMessage =>
    typeof data === "object" && data !== null && typeof (data as { type?: unknown }).type === "string",
});

/** Server to client. */
export const ServerPacket = definePacket<ServerMessage>("raid-server");
