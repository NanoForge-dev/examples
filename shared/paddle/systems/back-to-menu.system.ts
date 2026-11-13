import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { InputEnum } from "@nanoforge-dev/input";

import { justPressed } from "../just-pressed";
import { Menu } from "../scenes/menu.scene";

/**
 * Goes back to the menu when Enter is pressed (the end screens).
 *
 * @system
 * @side client
 */
export const backToMenu = (_registry: Registry, ctx: Context) => {
  if (justPressed(ctx, InputEnum.Enter)) void ctx.scenes.load(ctx, Menu);
};
