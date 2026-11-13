import type { Registry } from "@nanoforge-dev/ecs/client";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { clearScene } from "../screens";
import { gameOverScreen } from "../systems/game-over-screen.system";

/**
 * The end of a game, won or lost, and the way back to the menu.
 *
 * @scene
 * @side client
 */
export class GameOver extends EcsScene {
  override setup(registry: Registry) {
    registry.addSystem(gameOverScreen);
  }

  override teardown(registry: Registry) {
    clearScene(registry);
  }
}
