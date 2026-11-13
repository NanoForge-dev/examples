import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputEnum, InputLibrary } from "@nanoforge-dev/input";
import { SceneLibrary } from "@nanoforge-dev/scene";

import { DrawableRect2D } from "./components/drawable-rect-2d.component";
import { DrawableText2D } from "./components/drawable-text-2d.component";
import { Position2D } from "./components/position-2d.component";
import { SceneSwitchKey } from "./components/scene-switch-key.component";
import { SceneVarText } from "./components/scene-var-text.component";
import "./scene-vars";
import { BlueRoom } from "./scenes/blue-room.scene";
import { RedRoom } from "./scenes/red-room.scene";
import { draw2D } from "./systems/draw-2d.system";
import { showSceneVar } from "./systems/show-scene-var.system";
import { switchSceneOnKey } from "./systems/switch-scene-on-key.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 800, height: 600, fit: "contain" },
  });
  const ecs = new EcsLibrary();

  app.use(new Graphics2DLibrary());
  app.use(ecs);
  app.use(new InputLibrary());
  app.use(new SceneLibrary({ initial: RedRoom, scenes: { RedRoom, BlueRoom } }));
  app.use(new EditorLibrary());

  await app.init(options);

  const registry = ecs.registry;

  // Kept by every scene: the background, the help and the vars. Each room adds its own panel.
  const background = registry.spawnEntity();
  registry.addComponent(background, new Position2D(0, 0));
  registry.addComponent(background, new DrawableRect2D(800, 600, "#1e1e2e"));

  const help = registry.spawnEntity();
  registry.addComponent(help, new Position2D(20, 20));
  registry.addComponent(help, new DrawableText2D("Space to switch rooms", 24, "#cdd6f4"));
  registry.addComponent(help, new SceneSwitchKey(InputEnum.Space));

  const room = registry.spawnEntity();
  registry.addComponent(room, new Position2D(20, 520));
  registry.addComponent(room, new DrawableText2D("", 20, "#a6adc8"));
  registry.addComponent(room, new SceneVarText("room", "room (owned by the scene): "));

  const switches = registry.spawnEntity();
  registry.addComponent(switches, new Position2D(20, 555));
  registry.addComponent(switches, new DrawableText2D("", 20, "#a6adc8"));
  registry.addComponent(switches, new SceneVarText("switches", "switches (persistent): "));

  registry.addSystem(switchSceneOnKey);
  registry.addSystem(showSceneVar);
  registry.addSystem(draw2D);

  await app.run();
};
