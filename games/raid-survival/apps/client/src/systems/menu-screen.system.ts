import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";

import { tickScreen } from "../screens";
import { MenuView } from "../views/menu-view";

/**
 * Shows the main menu: username, skin, then the lobby and its start button.
 *
 * @system
 * @side client
 */
export const menuScreen = (registry: Registry, ctx: Context) => {
  tickScreen(registry, ctx, () => new MenuView());
};
