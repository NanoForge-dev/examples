import type { Context } from "@nanoforge-dev/common";
import "@nanoforge-dev/scene";
import type { ServerMessageOf } from "@raid-survival/shared/protocol";

import { GameOver } from "../scenes/game-over.scene";

export const gameOverHandler = (packet: ServerMessageOf<"gameOver">, ctx: Context): void => {
  ctx.scenes.vars.set(
    "result",
    { zombiesKilled: packet.zombiesKilled, won: packet.result === "victory" },
    { persistent: true },
  );
  void ctx.scenes.load(ctx, GameOver);
};
