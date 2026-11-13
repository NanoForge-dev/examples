import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputLibrary } from "@nanoforge-dev/input";

import { Draggable2D } from "./components/draggable-2d.component";
import { DrawableCircle2D } from "./components/drawable-circle-2d.component";
import { DrawableRect2D } from "./components/drawable-rect-2d.component";
import { DrawableText2D } from "./components/drawable-text-2d.component";
import { FollowMouse2D } from "./components/follow-mouse-2d.component";
import { MouseReadout } from "./components/mouse-readout.component";
import { Position2D } from "./components/position-2d.component";
import { drag2D } from "./systems/drag-2d.system";
import { draw2D } from "./systems/draw-2d.system";
import { followMouse2D } from "./systems/follow-mouse-2d.system";
import { showMouseReadout } from "./systems/show-mouse-readout.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 800, height: 600, fit: "contain" },
  });
  const ecs = new EcsLibrary();

  app.use(new Graphics2DLibrary());
  app.use(ecs);
  app.use(new InputLibrary());
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
    new DrawableText2D("Drag the squares with the left button", 22, "#cdd6f4"),
  );

  const readout = registry.spawnEntity();
  registry.addComponent(readout, new Position2D(20, 560));
  registry.addComponent(readout, new DrawableText2D("", 20, "#a6adc8"));
  registry.addComponent(readout, new MouseReadout());

  const red = registry.spawnEntity();
  registry.addComponent(red, new Position2D(250, 270));
  registry.addComponent(red, new DrawableRect2D(80, 80, "#f38ba8"));
  registry.addComponent(red, new Draggable2D());

  const green = registry.spawnEntity();
  registry.addComponent(green, new Position2D(470, 270));
  registry.addComponent(green, new DrawableRect2D(80, 80, "#a6e3a1"));
  registry.addComponent(green, new Draggable2D());

  const cursor = registry.spawnEntity();
  registry.addComponent(cursor, new Position2D(0, 0));
  registry.addComponent(cursor, new DrawableCircle2D(8, "#f9e2af"));
  registry.addComponent(cursor, new FollowMouse2D());

  registry.addSystem(followMouse2D);
  registry.addSystem(drag2D);
  registry.addSystem(showMouseReadout);
  registry.addSystem(draw2D);

  await app.run();
};
