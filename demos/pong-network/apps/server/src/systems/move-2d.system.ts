import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { Acceleration2D } from "../components/acceleration-2d.component";
import { Position2D } from "../components/position-2d.component";
import { Velocity2D } from "../components/velocity-2d.component";

/**
 * Moves entities: their `Acceleration2D` changes their `Velocity2D`, then their `Velocity2D`
 * changes their `Position2D`, by the time elapsed since the last frame.
 *
 * @system
 * @side shared
 */
export const move2D = (registry: Registry, ctx: Context) => {
  const seconds = ctx.app.delta / 1000;

  registry.getZipper([Acceleration2D, Velocity2D]).forEach(({ Acceleration2D, Velocity2D }) => {
    Velocity2D.x += Acceleration2D.x * seconds;
    Velocity2D.y += Acceleration2D.y * seconds;
  });
  registry.getZipper([Position2D, Velocity2D]).forEach(({ Position2D, Velocity2D }) => {
    Position2D.x += Velocity2D.x * seconds;
    Position2D.y += Velocity2D.y * seconds;
  });
};
