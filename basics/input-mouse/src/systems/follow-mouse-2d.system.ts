import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/input";
import { Position2D } from "../components/position-2d.component";

import { FollowMouse2D } from "../components/follow-mouse-2d.component";

/**
 * Moves every `FollowMouse2D` entity to the mouse cursor.
 *
 * @system
 * @side client
 */
export const followMouse2D = (registry: Registry, ctx: Context) => {
  const { x, y } = ctx.input.getMousePosition();

  registry.getZipper([FollowMouse2D, Position2D]).forEach(({ Position2D }) => {
    Position2D.x = x;
    Position2D.y = y;
  });
};
