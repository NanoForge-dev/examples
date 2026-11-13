import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { InputEnum } from "@nanoforge-dev/input";

import { justPressed } from "../keys";
import { Level1 } from "../scenes/level-1.scene";

/**
 * Starts a game at level 1, which loads `Run` first, when Enter is pressed.
 *
 * @system
 * @side client
 */
export const startOnEnter = (_registry: Registry, ctx: Context) => {
  if (justPressed(ctx, InputEnum.Enter)) void ctx.scenes.load(ctx, Level1);
};
