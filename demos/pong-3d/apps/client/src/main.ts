import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { Graphics3DLibrary } from "@nanoforge-dev/graphics-3d";
import { InputEnum, InputLibrary } from "@nanoforge-dev/input";
import { NetworkClientLibrary } from "@nanoforge-dev/network/client";

import { CameraRig } from "./components/camera-rig.component";
import { DrawableBox3D } from "./components/drawable-box-3d.component";
import { DrawableSphere3D } from "./components/drawable-sphere-3d.component";
import { NetworkId } from "./components/network-id.component";
import { PaddleInput } from "./components/paddle-input.component";
import { Position2D } from "./components/position-2d.component";
import { Transform3D } from "./components/transform-3d.component";
import { Velocity2D } from "./components/velocity-2d.component";
import { addLights } from "./lights";
import { Play } from "./pong-protocol";
import { applyMoves } from "./systems/apply-moves.system";
import { draw3D } from "./systems/draw-3d.system";
import { followCamera } from "./systems/follow-camera.system";
import { move2D } from "./systems/move-2d.system";
import { placeOnField } from "./systems/place-on-field.system";
import { sendInput } from "./systems/send-input.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 1920, height: 1080, fit: "contain" },
  });
  const graphics = new Graphics3DLibrary();
  const ecs = new EcsLibrary();
  const network = new NetworkClientLibrary();

  app.use(graphics);
  app.use(ecs);
  app.use(network);
  app.use(new InputLibrary());
  app.use(new EditorLibrary());

  await app.init(options);

  graphics.renderer.shadowMap.enabled = true;
  addLights(graphics.scene);

  const registry = ecs.registry;

  // 3D sizes are in world units: the field is 19.2 × 10.8 (`SCALE`, in field.ts).
  const table = registry.spawnEntity();
  registry.addComponent(table, new Position2D(0, 0));
  registry.addComponent(table, new Transform3D());
  registry.addComponent(table, new DrawableBox3D(19.2, 0.01, 10.8, "#2f6b2a", 0.6));

  const centerLine = registry.spawnEntity();
  registry.addComponent(centerLine, new Position2D(955, 0));
  registry.addComponent(centerLine, new Transform3D());
  registry.addComponent(centerLine, new DrawableBox3D(0.1, 0.02, 10.8, "#94cc75", 0.6));

  const topBorder = registry.spawnEntity();
  registry.addComponent(topBorder, new Position2D(-20, -20));
  registry.addComponent(topBorder, new Transform3D());
  registry.addComponent(topBorder, new DrawableBox3D(19.6, 0.4, 0.2, "#c8d0dc", 0.6));

  const bottomBorder = registry.spawnEntity();
  registry.addComponent(bottomBorder, new Position2D(-20, 1080));
  registry.addComponent(bottomBorder, new Transform3D());
  registry.addComponent(bottomBorder, new DrawableBox3D(19.6, 0.4, 0.2, "#c8d0dc", 0.6));

  const ball = registry.spawnEntity();
  registry.addComponent(ball, new Position2D(945, 525));
  registry.addComponent(ball, new Velocity2D(0, 0));
  registry.addComponent(ball, new NetworkId(0));
  registry.addComponent(ball, new Transform3D());
  registry.addComponent(ball, new DrawableSphere3D(0.15, "#ff4d3d", 0.3));

  const leftPaddle = registry.spawnEntity();
  registry.addComponent(leftPaddle, new Position2D(20, 390));
  registry.addComponent(leftPaddle, new Velocity2D(0, 0));
  registry.addComponent(leftPaddle, new NetworkId(1));
  registry.addComponent(leftPaddle, new Transform3D());
  registry.addComponent(leftPaddle, new DrawableBox3D(0.3, 0.4, 3, "#4d8dff", 0.6));

  const rightPaddle = registry.spawnEntity();
  registry.addComponent(rightPaddle, new Position2D(1870, 390));
  registry.addComponent(rightPaddle, new Velocity2D(0, 0));
  registry.addComponent(rightPaddle, new NetworkId(2));
  registry.addComponent(rightPaddle, new Transform3D());
  registry.addComponent(rightPaddle, new DrawableBox3D(0.3, 0.4, 3, "#ff9f40", 0.6));

  const player = registry.spawnEntity();
  registry.addComponent(player, new PaddleInput(InputEnum.ArrowLeft, InputEnum.ArrowRight, true));
  registry.addComponent(player, new CameraRig());

  registry.addSystem(sendInput);
  registry.addSystem(applyMoves);
  registry.addSystem(move2D);
  registry.addSystem(placeOnField);
  registry.addSystem(draw3D);
  registry.addSystem(followCamera);

  network.packets.send(Play);

  await app.run();
};
