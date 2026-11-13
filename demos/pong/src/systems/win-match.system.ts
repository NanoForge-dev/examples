import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { Goal } from "../components/goal.component";
import { Win } from "../scenes/win.scene";

/**
 * Ends the match once a player has `pointsToWin` points: loads `Win` with that player.
 *
 * @system
 * @side client
 */
export const winMatch = (registry: Registry, ctx: Context) => {
  const pointsToWin = ctx.scenes.vars.get("pointsToWin") ?? 5;

  const won = registry.getZipper([Goal]).find(({ Goal }) => Goal.points >= pointsToWin);
  if (won) void ctx.scenes.load(ctx, Win, { params: { player: won.Goal.player } });
};
