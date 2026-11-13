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
import { Match } from "./scenes/match.scene";
import { Menu } from "./scenes/menu.scene";
import { Win } from "./scenes/win.scene";
import { draw2D } from "./systems/draw-2d.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 1920, height: 1080, fit: "contain" },
  });
  const ecs = new EcsLibrary();

  app.use(new Graphics2DLibrary());
  app.use(ecs);
  app.use(new InputLibrary());
  app.use(new SceneLibrary({ initial: Menu, scenes: { Menu, Match, Win } }));
  app.use(new EditorLibrary());

  await app.init(options);

  const registry = ecs.registry;

  // The field, under every scene: `draw2D` stacks the shapes of one frame in entity order, and a
  // scene's entities reuse the ids of the scene before, so a field spawned by a scene could hide
  // what it spawned before it.
  const background = registry.spawnEntity();
  registry.addComponent(background, new Position2D(0, 0));
  registry.addComponent(background, new DrawableRect2D(1920, 1080, "#3a6327"));

  registry.addSystem(draw2D);

  await app.run();
};
