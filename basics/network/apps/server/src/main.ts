import type { RunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/server";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { NetworkServerLibrary } from "@nanoforge-dev/network/server";

import { joinPlayers } from "./systems/join-players.system";
import { keepInArena } from "./systems/keep-in-arena.system";
import { move2D } from "./systems/move-2d.system";
import { sendPlayers } from "./systems/send-players.system";
import { steerPlayers } from "./systems/steer-players.system";

export const main = async (options: RunOptions): Promise<void> => {
  const app = NanoforgeFactory.createServer({ tickRate: 60 });
  const ecs = new EcsLibrary();

  app.use(ecs);
  app.use(new NetworkServerLibrary());
  app.use(new EditorLibrary());

  await app.init(options);

  // No entity at the start: `joinPlayers` spawns one per client.
  const registry = ecs.registry;

  registry.addSystem(joinPlayers);
  registry.addSystem(steerPlayers);
  registry.addSystem(move2D);
  registry.addSystem(keepInArena);
  registry.addSystem(sendPlayers);

  await app.run();
};
