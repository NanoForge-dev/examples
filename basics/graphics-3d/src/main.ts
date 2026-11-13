import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { Graphics3DLibrary } from "@nanoforge-dev/graphics-3d";
import { Color, DirectionalLight, HemisphereLight } from "@nanoforge-dev/graphics-3d/three";

import { Box3D } from "./components/box-3d.component";
import { Spin3D } from "./components/spin-3d.component";
import { Transform3D } from "./components/transform-3d.component";
import { draw3D } from "./systems/draw-3d.system";
import { spin3D } from "./systems/spin-3d.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
    viewport: { width: 1280, height: 720, fit: "contain" },
  });
  const graphics = new Graphics3DLibrary();
  const ecs = new EcsLibrary();

  app.use(graphics);
  app.use(ecs);
  app.use(new EditorLibrary());

  await app.init(options);

  // The world around the entities: a background, a camera looking at the origin, and lights.
  const { scene, camera } = graphics;
  scene.background = new Color("#20232a");
  camera.position.set(0, 1.5, 4);
  camera.lookAt(0, 0, 0);
  const sun = new DirectionalLight("white", 3);
  sun.position.set(3, 5, 4);
  scene.add(new HemisphereLight("white", "#445566", 1), sun);

  const registry = ecs.registry;

  const cube = registry.spawnEntity();
  registry.addComponent(cube, new Transform3D(0, 0, 0));
  registry.addComponent(cube, new Box3D(1, 1, 1, "#44aa88"));
  registry.addComponent(cube, new Spin3D(20, 90, 0));

  registry.addSystem(spin3D);
  registry.addSystem(draw3D);

  await app.run();
};
