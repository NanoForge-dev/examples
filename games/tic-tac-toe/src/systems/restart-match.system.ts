import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/scene";

import { Clickable2D } from "../components/clickable-2d.component";
import { RestartButton } from "../components/restart-button.component";
import { Match } from "../scenes/match.scene";

/**
 * Starts a new match when the `RestartButton` is clicked.
 *
 * @system
 * @side client
 */
export const restartMatch = (registry: Registry, ctx: Context) => {
  registry.getZipper([RestartButton, Clickable2D]).forEach(({ Clickable2D }) => {
    if (!Clickable2D.clicked) return;
    // Unloading `Match` (and this popup) then loading it again gives an empty board.
    void ctx.scenes.unload(ctx, Match);
    void ctx.scenes.load(ctx, Match);
  });
};
