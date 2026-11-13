import type { Registry } from "@nanoforge-dev/ecs/client";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { clearScene } from "../screens";
import { launchGame } from "../systems/launch-game.system";

/**
 * A game: the map, the players, the zombie waves and the HUD, built by `launchGame` from the `startGame` message.
 *
 * @scene
 * @side client
 */
export class Game extends EcsScene {
  override setup(registry: Registry) {
    registry.addSystem(launchGame);
  }

  override teardown(registry: Registry) {
    clearScene(registry);
  }
}
