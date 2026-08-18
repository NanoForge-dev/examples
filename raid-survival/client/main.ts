import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";

import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { ECSClientLibrary } from "@nanoforge-dev/ecs-client";
import { Graphics2DLibrary, Layer } from "@nanoforge-dev/graphics-2d";
import { InputLibrary } from "@nanoforge-dev/input";
import { MusicLibrary } from "@nanoforge-dev/music";
import { NetworkClientLibrary } from "@nanoforge-dev/network-client";
import { SoundLibrary } from "@nanoforge-dev/sound";
import { movementSystem } from "./systems/movement.system";
import {
  cameraFollowSystem,
  playerAnimationSystem,
  playerControlSystem,
} from "./systems/player-control.system";
import { renderSystem } from "./systems/render.system";
import { LocalPlayerComponent, PlayerComponent } from "./components/player.component";
import { RenderableComponent } from "./components/renderable.component";
import { PositionComponent } from "./components/position.component";
import { VelocityComponent } from "./components/velocity.component";
import {PointerComponent} from "./components/pointer.component";
import {pointerSystem} from "./systems/pointer.system";

export const WorldLayer = new Layer();

export async function main(options: IRunOptions) {
  const app = NanoforgeFactory.createClient();
  
  const assetManagerLibrary = new AssetManagerLibrary();
  const ecsLibrary = new ECSClientLibrary();
  const graphicsLibrary = new Graphics2DLibrary();
  const inputLibrary = new InputLibrary();
  const musicLibrary = new MusicLibrary();
  const networkLibrary = new NetworkClientLibrary();
  const soundLibrary = new SoundLibrary();
  
  app.useAssetManager(assetManagerLibrary);
  app.useComponentSystem(ecsLibrary);
  app.useGraphics(graphicsLibrary);
  app.useInput(inputLibrary);
  app.use(Symbol("music"), musicLibrary);
  app.useNetwork(networkLibrary);
  app.useSound(soundLibrary);

  await app.init(options);

  graphicsLibrary.stage.add(WorldLayer);
  const canvas = WorldLayer.getCanvas()._canvas;
  const canva2D = canvas.getContext("2d");
  if (canva2D) canva2D.imageSmoothingEnabled = false;

  const registry = ecsLibrary.registry;

  const background = registry.spawnEntity();
  registry.addComponent(background, new PositionComponent(0, 0));
  registry.addComponent(background, new RenderableComponent("map.png"));

  const pointer = registry.spawnEntity();
  registry.addComponent(pointer, new PointerComponent());
  
  const player = registry.spawnEntity();
  registry.addComponent(player, new PlayerComponent());
  registry.addComponent(player, new LocalPlayerComponent());
  registry.addComponent(player, new RenderableComponent("player.png", {animationsKey: "player-animations.txt", scale: {x: 3, y: 3}}));
  registry.addComponent(player, new PositionComponent(100, 100));
  registry.addComponent(player, new VelocityComponent());

  registry.addSystem(pointerSystem);
  registry.addSystem(movementSystem);
  registry.addSystem(playerControlSystem);
  registry.addSystem(cameraFollowSystem);
  registry.addSystem(renderSystem);
  registry.addSystem(playerAnimationSystem);

  await app.run();
}
