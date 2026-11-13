import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { InputEnum } from "@nanoforge-dev/input";

import { justPressed } from "../just-pressed";
import { Menu } from "../scenes/menu.scene";
import { Pause } from "../scenes/pause.scene";

/**
 * Resumes the level with Escape or P, or quits to the menu with Q.
 *
 * @system
 * @side client
 */
export const pauseMenu = (_registry: Registry, ctx: Context) => {
  const escape = justPressed(ctx, InputEnum.Escape);
  const p = justPressed(ctx, InputEnum.KeyP);
  if (escape || p) void ctx.scenes.unload(ctx, Pause);
  else if (justPressed(ctx, InputEnum.KeyQ)) void ctx.scenes.load(ctx, Menu);
};
