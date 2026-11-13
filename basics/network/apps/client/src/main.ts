import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputEnum, InputLibrary } from "@nanoforge-dev/input";
import { NetworkClientLibrary } from "@nanoforge-dev/network/client";

import { DrawableRect2D } from "./components/drawable-rect-2d.component";
import { DrawableText2D } from "./components/drawable-text-2d.component";
import { MoveSender } from "./components/move-sender.component";
import { Position2D } from "./components/position-2d.component";
import { draw2D } from "./systems/draw-2d.system";
import { sendMoves } from "./systems/send-moves.system";
import { showPlayers } from "./systems/show-players.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 800, height: 600, fit: "contain" },
  });
  const ecs = new EcsLibrary();

  app.use(new Graphics2DLibrary());
  app.use(ecs);
  app.use(new InputLibrary());
  app.use(new NetworkClientLibrary());
  app.use(new EditorLibrary());

  await app.init(options);

  const registry = ecs.registry;

  const background = registry.spawnEntity();
  registry.addComponent(background, new Position2D(0, 0));
  registry.addComponent(background, new DrawableRect2D(800, 600, "#1e1e2e"));

  const help = registry.spawnEntity();
  registry.addComponent(help, new Position2D(20, 20));
  registry.addComponent(
    help,
    new DrawableText2D("Arrows to move. Open a second tab: you are green", 22, "#cdd6f4"),
  );
  registry.addComponent(
    help,
    new MoveSender(
      InputEnum.ArrowLeft,
      InputEnum.ArrowRight,
      InputEnum.ArrowUp,
      InputEnum.ArrowDown,
    ),
  );

  registry.addSystem(sendMoves);
  registry.addSystem(showPlayers);
  registry.addSystem(draw2D);

  await app.run();
};
