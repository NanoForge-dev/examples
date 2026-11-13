import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { InputEnum } from "@nanoforge-dev/input";
import { DrawableText2D } from "../components/drawable-text-2d.component";

import { MouseReadout } from "../components/mouse-readout.component";

/**
 * Counts the left clicks and writes them, with the mouse position, in the text of every
 * `MouseReadout` entity.
 *
 * @system
 * @side client
 */
export const showMouseReadout = (registry: Registry, ctx: Context) => {
  const { x, y } = ctx.input.getMousePosition();
  const down = ctx.input.isKeyPressed(InputEnum.MouseLeft) === true;

  registry.getZipper([MouseReadout, DrawableText2D]).forEach(({ MouseReadout, DrawableText2D }) => {
    if (down && !MouseReadout.held) MouseReadout.clicks++;
    MouseReadout.held = down;
    DrawableText2D.text = `Mouse ${Math.round(x)}, ${Math.round(y)}   Clicks ${MouseReadout.clicks}`;
  });
};
