import type { Registry } from "@nanoforge-dev/ecs/client";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { clearScene } from "../screens";
import { menuScreen } from "../systems/menu-screen.system";

/**
 * The main menu: pick a username and a skin, join the lobby, start the game.
 *
 * @scene
 * @side client
 */
export class Menu extends EcsScene {
  override setup(registry: Registry) {
    registry.addSystem(menuScreen);
  }

  override teardown(registry: Registry) {
    clearScene(registry);
  }
}
