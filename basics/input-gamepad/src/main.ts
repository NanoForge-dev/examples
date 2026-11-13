import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { ControllerButton, ControllerLibrary } from "@nanoforge-dev/input/controller";

import { ControllerMove2D } from "./components/controller-move-2d.component";
import { ControllerStatus } from "./components/controller-status.component";
import { DrawableRect2D } from "./components/drawable-rect-2d.component";
import { DrawableText2D } from "./components/drawable-text-2d.component";
import { Position2D } from "./components/position-2d.component";
import { Velocity2D } from "./components/velocity-2d.component";
import { controllerMove2D } from "./systems/controller-move-2d.system";
import { draw2D } from "./systems/draw-2d.system";
import { move2D } from "./systems/move-2d.system";
import { showControllerStatus } from "./systems/show-controller-status.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 800, height: 600, fit: "contain" },
  });
  const ecs = new EcsLibrary();

  app.use(new Graphics2DLibrary());
  app.use(ecs);
  app.use(new ControllerLibrary({ deadzone: 0.15 }));
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
    new DrawableText2D("Left stick to move, hold A to go faster", 24, "#cdd6f4"),
  );

  const status = registry.spawnEntity();
  registry.addComponent(status, new Position2D(20, 560));
  registry.addComponent(status, new DrawableText2D("", 18, "#a6adc8"));
  registry.addComponent(status, new ControllerStatus(0));

  const player = registry.spawnEntity();
  registry.addComponent(player, new Position2D(370, 270));
  registry.addComponent(player, new Velocity2D(0, 0));
  registry.addComponent(player, new ControllerMove2D(300, 0, ControllerButton.A));
  registry.addComponent(player, new DrawableRect2D(60, 60, "#89b4fa"));

  registry.addSystem(controllerMove2D);
  registry.addSystem(move2D);
  registry.addSystem(showControllerStatus);
  registry.addSystem(draw2D);

  await app.run();
};
