import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";
import "@nanoforge-dev/scene";
import type { ServerMessageOf } from "@raid-survival/shared/protocol";

import { LobbyStatusComponent } from "../components/lobby-status.component";
import { Game } from "../scenes/game.scene";

/** Moves from the lobby to the game: the `launchGame` system builds the world from `start`. */
export const startGameHandler = (
  packet: ServerMessageOf<"startGame">,
  registry: Registry,
  ctx: Context,
): void => {
  if (registry.getZipper([LobbyStatusComponent]).length === 0) return;
  ctx.scenes.vars.set("start", packet, { persistent: true });
  void ctx.scenes.load(ctx, Game);
};
