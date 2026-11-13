import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { DrawableText2D } from "../components/drawable-text-2d.component";
import { WinnerText } from "../components/winner-text.component";

/**
 * Writes the `winner` var in each `WinnerText`.
 *
 * @system
 * @side client
 */
export const showWinner = (registry: Registry, ctx: Context) => {
  const winner = ctx.scenes.vars.get("winner") ?? 1;

  registry.getZipper([WinnerText, DrawableText2D]).forEach(({ DrawableText2D }) => {
    DrawableText2D.text = `Player ${winner} wins!`;
  });
};
