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

// The engine's own per-tick system runner (@nanoforge-dev/ecs-lib's WASM Registry.run_systems,
// invoked from @nanoforge-dev/core's Core.runExecute) has no try/catch anywhere in the chain - an
// uncaught exception in ANY one system silently aborts that tick's run_systems call entirely,
// taking every system registered AFTER it down with it (they simply never run again, forever,
// with no visible error), and can stop the engine's own re-scheduling of the next tick outright.
// Wrapping every system in this before it ever reaches registry.addSystem means one system's bug
// can only ever break that system - not everything registered after it - and any exception (now
// or in the future) gets logged with the system's name instead of vanishing silently.
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
  // Autonomous, no player input - fires its own bullets the same way weaponSystem does for
  // players, so it belongs right alongside it, before bulletSystem resolves anything spawned
  // this tick.
  registry.addSystem(safeSystem(towerSystem));
  registry.addSystem(safeSystem(moveSystem));
  registry.addSystem(safeSystem(mapCollisionSystem));
  registry.addSystem(safeSystem(obstacleCollisionSystem));
  registry.addSystem(safeSystem(moveSyncSystem));
  registry.addSystem(safeSystem(bulletSystem));
  registry.addSystem(safeSystem(aiSystem));
  registry.addSystem(safeSystem(zombieWaveSystem));
  registry.addSystem(safeSystem(zombieDeathSystem));
  // After zombieDeathSystem so a box dropped this exact tick can already be picked up the same
  // tick (both just read/write plain components, order only matters for same-tick freshness).
  registry.addSystem(safeSystem(lootBoxPickupSystem));
  registry.addSystem(safeSystem(buildingDeathSystem));
  // After weaponSystem/moveInputSystem (Health/Position are current for this tick) and before
  // gameOverSystem, so a revive completed this exact tick is already reflected in Health before
  // gameOverSystem's allPlayersDead check runs.
  registry.addSystem(safeSystem(reviveSystem));
  // Consumes the same E-press one-shot revive.system.ts's `targetId` deferral checks - must run
  // after it so an active revive channel reliably wins the same tick's key press.
  registry.addSystem(safeSystem(buildingInteractSystem));
  registry.addSystem(safeSystem(gameOverSystem));

  await app.run();
}
