import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/input";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Position2D } from "../components/position-2d.component";

import { Draggable2D } from "../components/draggable-2d.component";

/**
 * Moves the `Draggable2D` rectangles the mouse drags: a drag that starts on a rectangle carries it
 * until the button is released.
 *
 * @system
 * @side client
 */
export const drag2D = (registry: Registry, ctx: Context) => {
  const drag = ctx.input.getDragState();

  registry
    .getZipper([Draggable2D, Position2D, DrawableRect2D])
    .forEach(({ Draggable2D, Position2D, DrawableRect2D }) => {
      if (!drag.active || drag.button !== Draggable2D.button) {
        Draggable2D.checked = false;
        Draggable2D.grabbed = false;
        return;
      }
      if (!Draggable2D.checked) {
        Draggable2D.checked = true;
        Draggable2D.grabbed =
          drag.startX >= Position2D.x &&
          drag.startX <= Position2D.x + DrawableRect2D.width &&
          drag.startY >= Position2D.y &&
          drag.startY <= Position2D.y + DrawableRect2D.height;
        Draggable2D.fromX = Position2D.x;
        Draggable2D.fromY = Position2D.y;
      }
      if (!Draggable2D.grabbed) return;
      Position2D.x = Draggable2D.fromX + drag.deltaX;
      Position2D.y = Draggable2D.fromY + drag.deltaY;
    });
};
