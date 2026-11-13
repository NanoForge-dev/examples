import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { InputEnum } from "@nanoforge-dev/input";

import { justPressed } from "../just-pressed";
import { Match } from "../scenes/match.scene";

/**
 * Starts a match when Enter is pressed.
 *
 * @system
 * @side client
 */
export const startMatch = (_registry: Registry, ctx: Context) => {
  if (justPressed(ctx, InputEnum.Enter)) void ctx.scenes.load(ctx, Match);
};
