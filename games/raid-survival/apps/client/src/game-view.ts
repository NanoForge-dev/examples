import type { Registry } from "@nanoforge-dev/ecs/client";

import { GameView } from "./components/game-view.component";

/** The layers of the game on screen, while the game scene is loaded. */
export const gameView = (registry: Registry): GameView | undefined =>
  (registry.getZipper([GameView]) as { GameView: GameView }[])[0]?.GameView;
