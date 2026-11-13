import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputLibrary } from "@nanoforge-dev/input";
import { SceneLibrary } from "@nanoforge-dev/scene";

import { DrawableRect2D } from "./components/drawable-rect-2d.component";
import { Position2D } from "./components/position-2d.component";
import "./scene-vars";
import { GameOver } from "./scenes/game-over.scene";
import { Level1 } from "./scenes/level-1.scene";
import { Level2 } from "./scenes/level-2.scene";
import { Level3 } from "./scenes/level-3.scene";
import { Menu } from "./scenes/menu.scene";
import { Pause } from "./scenes/pause.scene";
import { Run } from "./scenes/run.scene";
import { Victory } from "./scenes/victory.scene";
import { draw2D } from "./systems/draw-2d.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 1280, height: 720, fit: "contain" },
  });
  const ecs = new EcsLibrary();

  app.use(new Graphics2DLibrary());
  app.use(ecs);
  app.use(new InputLibrary());
  // Every entity on screen but the background belongs to a scene: the menu loads at the first tick.
  app.use(
    new SceneLibrary({
      initial: Menu,
      scenes: { Menu, Run, Level1, Level2, Level3, Pause, GameOver, Victory },
    }),
  );
  app.use(new EditorLibrary());

  await app.init(options);

  const registry = ecs.registry;

  const background = registry.spawnEntity();
  registry.addComponent(background, new Position2D(0, 0));
  registry.addComponent(background, new DrawableRect2D(1280, 720, "#10141f"));

  registry.addSystem(draw2D);

  await app.run();
};
