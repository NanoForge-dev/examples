import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";

import { GameView } from "./components/game-view.component";
import { Screen } from "./components/screen.component";
import type { ScreenView } from "./views/screen-view";

/** Shows the scene's screen: builds it on the first tick, then updates it every tick. */
export const tickScreen = (registry: Registry, ctx: Context, make: () => ScreenView): void => {
  let screen = (registry.getZipper([Screen]) as { Screen: Screen }[])[0]?.Screen;
  if (!screen) {
    screen = new Screen(make());
    registry.addComponent(registry.spawnEntity(), screen);
    screen.view.load(registry, ctx);
  }
  screen.view.tick(registry, ctx);
};

/**
 * Empties the registry when a scene is unloaded, as the original scene manager did: the screen
 * and the game layers first, then every entity, those spawned while playing included.
 *
 * @remarks
 * The scenes spawn nothing in `setup`: `EcsScene` would kill those entities again after this
 * `clearEntities()`, and a second kill hands their ids out twice.
 */
export const clearScene = (registry: Registry): void => {
  for (const { Screen: screen } of registry.getZipper([Screen]) as { Screen: Screen }[])
    screen.destroy();
  for (const { GameView: view } of registry.getZipper([GameView]) as { GameView: GameView }[])
    view.destroy();
  registry.clearEntities();
};
