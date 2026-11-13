import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputEnum, InputLibrary } from "@nanoforge-dev/input";
import { MusicLibrary } from "@nanoforge-dev/music";

import { DrawableRect2D } from "./components/drawable-rect-2d.component";
import { DrawableText2D } from "./components/drawable-text-2d.component";
import { Position2D } from "./components/position-2d.component";
import { MuteOnKey } from "./components/mute-on-key.component";
import { PlayOnKey } from "./components/play-on-key.component";
import { draw2D } from "./systems/draw-2d.system";
import { muteMusicOnKey } from "./systems/mute-music-on-key.system";
import { playMusicOnKey } from "./systems/play-music-on-key.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 800, height: 600, fit: "contain" },
  });
  const ecs = new EcsLibrary();

  app.use(new Graphics2DLibrary());
  app.use(ecs);
  app.use(new InputLibrary());
  app.use(new MusicLibrary());
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
    new DrawableText2D("1: first track   2: second track", 24, "#cdd6f4"),
  );

  const mute = registry.spawnEntity();
  registry.addComponent(mute, new Position2D(20, 60));
  registry.addComponent(mute, new DrawableText2D("", 24, "#f9e2af"));
  registry.addComponent(mute, new MuteOnKey(InputEnum.KeyM));

  const first = registry.spawnEntity();
  registry.addComponent(first, new PlayOnKey(InputEnum.Digit1, "/track-a.wav"));

  const second = registry.spawnEntity();
  registry.addComponent(second, new PlayOnKey(InputEnum.Digit2, "/track-b.wav"));

  registry.addSystem(muteMusicOnKey);
  registry.addSystem(playMusicOnKey);
  registry.addSystem(draw2D);

  await app.run();
};
