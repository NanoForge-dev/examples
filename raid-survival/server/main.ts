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
import { aiSystem } from "./systems/ai.system";
import { zombieWaveSystem } from "./systems/zombie-wave.system";
import { zombieDeathSystem } from "./systems/zombie-death.system";
import { buildingDeathSystem } from "./systems/building-death.system";
import { gameOverSystem } from "./systems/game-over.system";
import { packetHandler } from "./systems/packet-handler.system";

export const PLAYER_SPEED = 100;

export enum GameStatusEnum {
  Lobby,
  InGame,
  EndScreen,
}

export const gameStatus = { status: GameStatusEnum.Lobby };

export const clients: { clientId: number; entityId: number; username: string; connected: boolean }[] = [];

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

  registry.addSystem(packetHandler);
  registry.addSystem(moveInputSystem);
  registry.addSystem(moveSystem);
  registry.addSystem(mapCollisionSystem);
  registry.addSystem(obstacleCollisionSystem);
  registry.addSystem(moveSyncSystem);
  registry.addSystem(aiSystem);
  registry.addSystem(zombieWaveSystem);
  registry.addSystem(zombieDeathSystem);
  registry.addSystem(buildingDeathSystem);
  registry.addSystem(gameOverSystem);

  await app.run();
}
