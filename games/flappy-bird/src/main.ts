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
import { GameOver } from "./scenes/game-over.scene";
import { Play } from "./scenes/play.scene";
import { Ready } from "./scenes/ready.scene";
import { Sky } from "./scenes/sky.scene";
import { draw2D } from "./systems/draw-2d.system";
import { drawOrder2D } from "./systems/draw-order-2d.system";
import { loadSounds } from "./systems/load-sounds.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 420, height: 560, fit: "contain" },
  });
  const ecs = new EcsLibrary();

  app.use(new Graphics2DLibrary());
  app.use(ecs);
  app.use(new InputLibrary());
  app.use(new SoundLibrary());
  app.use(new SceneLibrary({ initial: Ready, scenes: { Sky, Ready, Play, GameOver } }));
  app.use(new EditorLibrary());

  await app.init(options);

  const registry = ecs.registry;

  const wing = registry.spawnEntity();
  registry.addComponent(wing, new SoundEffect("wing", "/wing.wav"));
  const point = registry.spawnEntity();
  registry.addComponent(point, new SoundEffect("point", "/point.wav"));
  const hit = registry.spawnEntity();
  registry.addComponent(hit, new SoundEffect("hit", "/hit.wav"));
  const die = registry.spawnEntity();
  registry.addComponent(die, new SoundEffect("die", "/die.wav"));
  const swoosh = registry.spawnEntity();
  registry.addComponent(swoosh, new SoundEffect("swoosh", "/swoosh.wav"));

  registry.addSystem(loadSounds);
  registry.addSystem(draw2D);
  registry.addSystem(drawOrder2D);

  await app.run();
};
