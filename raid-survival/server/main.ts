import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";

import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { ECSServerLibrary } from "@nanoforge-dev/ecs-server";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";
import { moveSystem } from "./systems/move.system";
import { mapCollisionSystem } from "./systems/map-collision.system";
import { obstacleCollisionSystem } from "./systems/obstacle-collision.system";
import { aiSystem } from "./systems/ai.system";
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
  registry.addSystem(moveSystem);
  registry.addSystem(mapCollisionSystem);
  registry.addSystem(obstacleCollisionSystem);
  registry.addSystem(aiSystem);

  await app.run();
}
