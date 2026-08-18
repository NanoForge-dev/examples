import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";

import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { ECSServerLibrary } from "@nanoforge-dev/ecs-server";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { ExampleComponent } from "./components/example.component";

import { exampleSystem } from "./systems/example.system";

export async function main(options: IRunOptions) {
  const app = NanoforgeFactory.createServer();
  
  const assetManagerLibrary = new AssetManagerLibrary();
  const ecsLibrary = new ECSServerLibrary();
  const networkLibrary = new NetworkServerLibrary();
  
  app.useAssetManager(assetManagerLibrary);
  app.useComponentSystem(ecsLibrary);
  app.useNetwork(networkLibrary);
  
  await app.init(options);
  
  const registry = ecsLibrary.registry;
  
  const exampleEntity = registry.spawnEntity();
  registry.addComponent(exampleEntity, new ExampleComponent("example", 10, undefined));
  
  registry.addSystem(exampleSystem);
  
  await app.run();
}
