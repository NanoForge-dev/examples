import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";
import "@nanoforge-dev/scene";

import { tickScreen } from "../screens";
import { GameOverView } from "../views/game-over-view";

/**
 * Shows how the game ended (the `result` scene var), and the button back to the menu.
 *
 * @system
 * @side client
 */
export const gameOverScreen = (registry: Registry, ctx: Context) => {
  const result = ctx.scenes.vars.get("result") ?? { zombiesKilled: 0, won: false };
  tickScreen(registry, ctx, () => new GameOverView(result.zombiesKilled, result.won));
};
