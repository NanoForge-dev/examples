import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { InputEnum } from "@nanoforge-dev/input";

import { Clickable2D } from "../components/clickable-2d.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Position2D } from "../components/position-2d.component";
import { justPressed } from "../just-pressed";

/**
 * Lights up the `Clickable2D` rectangle under the cursor, and marks it `clicked` on the frame the
 * left button goes down over it. Add it before the systems that read `clicked`.
 *
 * @system
 * @side client
 */
export const click2D = (registry: Registry, ctx: Context) => {
  const mouse = ctx.input.getMouseState();
  const pressed = justPressed(ctx, InputEnum.MouseLeft);

  registry
    .getZipper([Clickable2D, Position2D, DrawableRect2D])
    .forEach(({ Clickable2D, Position2D, DrawableRect2D }) => {
      Clickable2D.hovered =
        mouse.focus &&
        mouse.x >= Position2D.x &&
        mouse.x < Position2D.x + DrawableRect2D.width &&
        mouse.y >= Position2D.y &&
        mouse.y < Position2D.y + DrawableRect2D.height;
      Clickable2D.clicked = Clickable2D.hovered && pressed;
      DrawableRect2D.fillColor = Clickable2D.hovered ? Clickable2D.hoverColor : Clickable2D.color;
    });
};
