import type { RunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/server";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { NetworkServerLibrary } from "@nanoforge-dev/network/server";

import { GameState } from "./components/game-state.component";
import { aiSystem } from "./systems/ai.system";
import { buildingDeathSystem } from "./systems/building-death.system";
import { buildingInteractSystem } from "./systems/building-interact.system";
import { bulletSystem } from "./systems/bullet.system";
import { gameOverSystem } from "./systems/game-over.system";
import { lootBoxPickupSystem } from "./systems/loot-box-pickup.system";
import { mapCollisionSystem } from "./systems/map-collision.system";
import { move2D } from "./systems/move-2d.system";
import { moveInputSystem } from "./systems/move-input.system";
import { moveSyncSystem } from "./systems/move-sync.system";
import { obstacleCollisionSystem } from "./systems/obstacle-collision.system";
import { packetDispatch } from "./systems/packet-dispatch.system";
import { reviveSystem } from "./systems/revive.system";
import { towerSystem } from "./systems/tower.system";
import { weaponSystem } from "./systems/weapon.system";
import { zombieDeathSystem } from "./systems/zombie-death.system";
import { zombieWaveSystem } from "./systems/zombie-wave.system";

export const main = async (options: RunOptions): Promise<void> => {
  const app = NanoforgeFactory.createServer({ tickRate: 60 });
  const ecs = new EcsLibrary();

  app.use(ecs);
  app.use(new NetworkServerLibrary());
  app.use(new EditorLibrary());

  await app.init(options);

  const registry = ecs.registry;

  const game = registry.spawnEntity();
  registry.addComponent(game, new GameState("lobby"));

  registry.addSystem(packetDispatch);
  registry.addSystem(moveInputSystem);
  registry.addSystem(weaponSystem);
  // Fires its own bullets like weaponSystem, before bulletSystem resolves this tick's spawns.
  registry.addSystem(towerSystem);
  registry.addSystem(move2D);
  registry.addSystem(mapCollisionSystem);
  registry.addSystem(obstacleCollisionSystem);
  registry.addSystem(moveSyncSystem);
  registry.addSystem(bulletSystem);
  registry.addSystem(aiSystem);
  registry.addSystem(zombieWaveSystem);
  registry.addSystem(zombieDeathSystem);
  // After zombieDeathSystem, so a box dropped this tick can be picked up the same tick.
  registry.addSystem(lootBoxPickupSystem);
  registry.addSystem(buildingDeathSystem);
  // Before gameOverSystem, so a revive completed this tick counts in its "all players dead" check.
  registry.addSystem(reviveSystem);
  // After reviveSystem, so an active revive channel wins the same tick's E press over an interact.
  registry.addSystem(buildingInteractSystem);
  registry.addSystem(gameOverSystem);

  await app.run();
};
