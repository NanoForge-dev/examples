import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { InputEnum } from "@nanoforge-dev/input";

import { justPressed } from "../keys";
import { Pause } from "../scenes/pause.scene";

/**
 * Opens the pause menu over the level with Escape or P.
 *
 * @system
 * @side client
 */
export const pauseOnEscape = (_registry: Registry, ctx: Context) => {
  if (ctx.scenes.vars.has("paused")) return;
  const escape = justPressed(ctx, InputEnum.Escape);
  const p = justPressed(ctx, InputEnum.KeyP);
  if (escape || p) void ctx.scenes.load(ctx, Pause, { parent: "current" });
};
