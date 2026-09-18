import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";

import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { ECSServerLibrary } from "@nanoforge-dev/ecs-server";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";
import { moveInputSystem } from "./systems/move-input.system";
import { moveSystem } from "./systems/move.system";
import { mapCollisionSystem } from "./systems/map-collision.system";
import { obstacleCollisionSystem } from "./systems/obstacle-collision.system";
import { moveSyncSystem } from "./systems/move-sync.system";
import { weaponSystem } from "./systems/weapon.system";
import { towerSystem } from "./systems/tower.system";
import { buildingInteractSystem } from "./systems/building-interact.system";
import { bulletSystem } from "./systems/bullet.system";
import { aiSystem } from "./systems/ai.system";
import { zombieWaveSystem } from "./systems/zombie-wave.system";
import { zombieDeathSystem } from "./systems/zombie-death.system";
import { lootBoxPickupSystem } from "./systems/loot-box-pickup.system";
import { buildingDeathSystem } from "./systems/building-death.system";
import { reviveSystem } from "./systems/revive.system";
import { gameOverSystem } from "./systems/game-over.system";
import { packetHandler } from "./systems/packet-handler.system";

// The engine's system runner has no error isolation between systems - wrapping each one here
// means a throwing system only breaks itself, not every system registered after it.
function safeSystem<Fn extends (...args: never[]) => unknown>(system: Fn): Fn {
  return ((...args: never[]) => {
    try {
      system(...args);
    } catch (err) {
      console.error(`[system:${system.name}]`, err);
    }
  }) as Fn;
}

export const PLAYER_SPEED = 100;

export enum GameStatusEnum {
  Lobby,
  InGame,
  EndScreen,
}

export const gameStatus = { status: GameStatusEnum.Lobby };

export const clients: {
  clientId: number;
  entityId: number;
  username: string;
  connected: boolean;
  skin: number;
}[] = [];

export async function main(options: IRunOptions) {
  const app = NanoforgeFactory.createServer();

  const assetManagerLibrary = new AssetManagerLibrary();
  const ecsLibrary = new ECSServerLibrary();
  const networkLibrary = new NetworkServerLibrary();

  app.useAssetManager(assetManagerLibrary);
  app.useComponentSystem(ecsLibrary);
  app.useNetwork(networkLibrary);

  await app.init(options);

  const registry = ecsLibrary.registry;

  registry.addSystem(safeSystem(packetHandler));
  registry.addSystem(safeSystem(moveInputSystem));
  registry.addSystem(safeSystem(weaponSystem));
  // Fires its own bullets like weaponSystem, so it runs alongside it, before bulletSystem
  // resolves this tick's spawns.
  registry.addSystem(safeSystem(towerSystem));
  registry.addSystem(safeSystem(moveSystem));
  registry.addSystem(safeSystem(mapCollisionSystem));
  registry.addSystem(safeSystem(obstacleCollisionSystem));
  registry.addSystem(safeSystem(moveSyncSystem));
  registry.addSystem(safeSystem(bulletSystem));
  registry.addSystem(safeSystem(aiSystem));
  registry.addSystem(safeSystem(zombieWaveSystem));
  registry.addSystem(safeSystem(zombieDeathSystem));
  // After zombieDeathSystem so a box dropped this tick can be picked up the same tick.
  registry.addSystem(safeSystem(lootBoxPickupSystem));
  registry.addSystem(safeSystem(buildingDeathSystem));
  // Before gameOverSystem so a revive completed this tick is reflected before the
  // allPlayersDead check.
  registry.addSystem(safeSystem(reviveSystem));
  // After reviveSystem so an active revive channel wins the same tick's E press over an interact.
  registry.addSystem(safeSystem(buildingInteractSystem));
  registry.addSystem(safeSystem(gameOverSystem));

  await app.run();
}
