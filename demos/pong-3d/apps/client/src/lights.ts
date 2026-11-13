import {
  Color,
  DirectionalLight,
  HemisphereLight,
  type Scene,
} from "@nanoforge-dev/graphics-3d/three";

/** Adds the background and the lights to the scene: a sky light and a sun that casts shadows. */
export const addLights = (scene: Scene): void => {
  scene.background = new Color("#10141c");

  const sun = new DirectionalLight("white", 2.5);
  sun.position.set(-4, 12, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 8, bottom: -8 });

  scene.add(new HemisphereLight("#dfe8ff", "#20301c", 1.2), sun);
};
