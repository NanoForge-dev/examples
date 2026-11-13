import type { Registry } from "@nanoforge-dev/ecs";

import { overlap, pushOut } from "../collisions";
import { HitboxRect2D } from "../components/hitbox-rect-2d.component";
import { Paddle } from "../components/paddle.component";
import { Position2D } from "../components/position-2d.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { Wall } from "../components/wall.component";

/**
 * Stops each `Paddle` at the `Wall` entities: pushed out of them, and stopped on that axis. Add it
 * after `move2D`.
 *
 * @system
 * @side shared
 */
export const blockPaddles = (registry: Registry) => {
  const walls = registry.getZipper([Wall, Position2D, HitboxRect2D]);

  registry
    .getZipper([Paddle, Position2D, Velocity2D, HitboxRect2D])
    .forEach(({ Position2D: paddle, Velocity2D: velocity, HitboxRect2D: box }) => {
      for (const { Position2D, HitboxRect2D } of walls) {
        if (overlap(paddle, box, Position2D, HitboxRect2D))
          pushOut(paddle, box, velocity, Position2D, HitboxRect2D, false);
      }
    });
};
