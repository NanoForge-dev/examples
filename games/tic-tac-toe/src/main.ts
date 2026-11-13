import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputLibrary } from "@nanoforge-dev/input";
import { SceneLibrary } from "@nanoforge-dev/scene";
import { SoundLibrary } from "@nanoforge-dev/sound";

import { SoundEffect } from "./components/sound-effect.component";
import "./scene-vars";
import { EndPopup } from "./scenes/end-popup.scene";
import { Match } from "./scenes/match.scene";
import { centerText2D } from "./systems/center-text-2d.system";
import { click2D } from "./systems/click-2d.system";
import { draw2D } from "./systems/draw-2d.system";
import { drawOrder2D } from "./systems/draw-order-2d.system";
import { loadSounds } from "./systems/load-sounds.system";
import { showSceneVar } from "./systems/show-scene-var.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 700, height: 700, fit: "contain" },
  });
  const ecs = new EcsLibrary();

  app.use(new Graphics2DLibrary());
  app.use(ecs);
  app.use(new InputLibrary());
  app.use(new SoundLibrary());
  app.use(new SceneLibrary({ initial: Match, scenes: { Match, EndPopup } }));
  app.use(new EditorLibrary());

  await app.init(options);

  const registry = ecs.registry;

  const marker = registry.spawnEntity();
  registry.addComponent(marker, new SoundEffect("marker", "/marker.mp3"));

  registry.addSystem(loadSounds);
  registry.addSystem(click2D);
  registry.addSystem(showSceneVar);
  registry.addSystem(draw2D);
  registry.addSystem(centerText2D);
  registry.addSystem(drawOrder2D);

  await app.run();
};
