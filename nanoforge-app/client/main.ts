import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";

import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { ECSClientLibrary } from "@nanoforge-dev/ecs-client";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputLibrary } from "@nanoforge-dev/input";
import { MusicLibrary } from "@nanoforge-dev/music";
import { SoundLibrary } from "@nanoforge-dev/sound";

import { ExampleComponent } from "./components/example.component";

import { exampleSystem } from "./systems/example.system";

export async function main(options: IRunOptions) {
  const app = NanoforgeFactory.createClient();
  
  const assetManagerLibrary = new AssetManagerLibrary();
  const ecsLibrary = new ECSClientLibrary();
  const graphicsLibrary = new Graphics2DLibrary();
  const inputLibrary = new InputLibrary();
  const musicLibrary = new MusicLibrary();
  const soundLibrary = new SoundLibrary();
  
  app.useAssetManager(assetManagerLibrary);
  app.useComponentSystem(ecsLibrary);
  app.useGraphics(graphicsLibrary);
  app.useInput(inputLibrary);
  app.use(Symbol("music"), musicLibrary);
  app.useSound(soundLibrary);
  
  await app.init(options);
  
  const registry = ecsLibrary.registry;
  
  const exampleEntity = registry.spawnEntity();
  registry.addComponent(exampleEntity, new ExampleComponent("example", 10, undefined));
  
  registry.addSystem(exampleSystem);
  
  await app.run();
}
