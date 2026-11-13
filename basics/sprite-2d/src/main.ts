import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";

import { DrawableCircle2D } from "./components/drawable-circle-2d.component";
import { DrawableRect2D } from "./components/drawable-rect-2d.component";
import { Position2D } from "./components/position-2d.component";
import { draw2D } from "./systems/draw-2d.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 288, height: 512, fit: "contain" },
  });
  const ecs = new EcsLibrary();

  app.use(new Graphics2DLibrary());
  app.use(ecs);
  app.use(new EditorLibrary());

  await app.init(options);

  const registry = ecs.registry;

  const background = registry.spawnEntity();
  registry.addComponent(background, new Position2D(0, 0));
  registry.addComponent(background, new DrawableRect2D(288, 512, "#4ec0ca", "/background-day.png"));

  const pipe = registry.spawnEntity();
  registry.addComponent(pipe, new Position2D(180, 300));
  registry.addComponent(pipe, new DrawableRect2D(52, 320, "#5ee270", "/pipe-green.png"));

  const bird = registry.spawnEntity();
  registry.addComponent(bird, new Position2D(60, 220));
  registry.addComponent(bird, new DrawableRect2D(68, 48, "#f8d030", "/yellowbird-midflap.png"));

  const roundBird = registry.spawnEntity();
  registry.addComponent(roundBird, new Position2D(100, 380));
  registry.addComponent(roundBird, new DrawableCircle2D(30, "#f8d030", "/yellowbird-midflap.png"));

  registry.addSystem(draw2D);

  await app.run();
};
