import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputLibrary } from "@nanoforge-dev/input";
import { NetworkClientLibrary } from "@nanoforge-dev/network/client";

import { DrawableRect2D } from "./components/drawable-rect-2d.component";
import { NetworkId } from "./components/network-id.component";
import { PaddleInput } from "./components/paddle-input.component";
import { Position2D } from "./components/position-2d.component";
import { Velocity2D } from "./components/velocity-2d.component";
import { Play } from "./pong-protocol";
import { applyMoves } from "./systems/apply-moves.system";
import { draw2D } from "./systems/draw-2d.system";
import { move2D } from "./systems/move-2d.system";
import { sendInput } from "./systems/send-input.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 1920, height: 1080, fit: "contain" },
  });
  const ecs = new EcsLibrary();
  const network = new NetworkClientLibrary();

  app.use(new Graphics2DLibrary());
  app.use(ecs);
  app.use(network);
  app.use(new InputLibrary());
  app.use(new EditorLibrary());

  await app.init(options);

  const registry = ecs.registry;

  const field = registry.spawnEntity();
  registry.addComponent(field, new Position2D(0, 0));
  registry.addComponent(field, new DrawableRect2D(1920, 1080, "#3a6327"));

  const centerLine = registry.spawnEntity();
  registry.addComponent(centerLine, new Position2D(955, 0));
  registry.addComponent(centerLine, new DrawableRect2D(10, 1080, "#94cc75"));

  const ball = registry.spawnEntity();
  registry.addComponent(ball, new Position2D(945, 525));
  registry.addComponent(ball, new Velocity2D(0, 0));
  registry.addComponent(ball, new NetworkId(0));
  registry.addComponent(ball, new DrawableRect2D(30, 30, "#ff4d3d", "", 1, 0, 15));

  const leftPaddle = registry.spawnEntity();
  registry.addComponent(leftPaddle, new Position2D(20, 390));
  registry.addComponent(leftPaddle, new Velocity2D(0, 0));
  registry.addComponent(leftPaddle, new NetworkId(1));
  registry.addComponent(leftPaddle, new DrawableRect2D(30, 300, "#4d8dff"));

  const rightPaddle = registry.spawnEntity();
  registry.addComponent(rightPaddle, new Position2D(1870, 390));
  registry.addComponent(rightPaddle, new Velocity2D(0, 0));
  registry.addComponent(rightPaddle, new NetworkId(2));
  registry.addComponent(rightPaddle, new DrawableRect2D(30, 300, "#ff9f40"));

  const player = registry.spawnEntity();
  registry.addComponent(player, new PaddleInput());

  registry.addSystem(sendInput);
  registry.addSystem(applyMoves);
  registry.addSystem(move2D);
  registry.addSystem(draw2D);

  network.packets.send(Play);

  await app.run();
};
