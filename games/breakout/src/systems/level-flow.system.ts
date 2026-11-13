import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { Level } from "../level";
import { GameOver } from "../scenes/game-over.scene";
import { Victory } from "../scenes/victory.scene";

/**
 * Moves on when the level ends: to the next level once every brick is broken, or to the end
 * screen when the last life is lost.
 *
 * @system
 * @side client
 */
export const levelFlow = (_registry: Registry, ctx: Context) => {
  const vars = ctx.scenes.vars;
  if (vars.has("paused")) return;
  const score = vars.get("score") ?? 0;

  if ((vars.get("lives") ?? 0) <= 0) {
    void ctx.scenes.load(ctx, GameOver, { params: { score } });
    return;
  }
  if ((vars.get("bricksLeft") ?? 1) > 0) return;
  const level = ctx.scenes.loaded.find((scene) => scene instanceof Level);
  if (level?.next) void ctx.scenes.load(ctx, level.next);
  else void ctx.scenes.load(ctx, Victory, { params: { score } });
};
