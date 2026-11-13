import type { Registry } from "@nanoforge-dev/ecs";

import { overlap } from "../collisions";
import { Ball } from "../components/ball.component";
import { Goal } from "../components/goal.component";
import { HitboxRect2D } from "../components/hitbox-rect-2d.component";
import { Position2D } from "../components/position-2d.component";
import { Serve } from "../components/serve.component";
import { Velocity2D } from "../components/velocity-2d.component";

/**
 * Gives a point to a `Goal`'s player when a `Ball` enters it, and puts the ball back where its
 * `Serve` says, to be served again. Add it after `move2D`.
 *
 * @system
 * @side shared
 */
export const scoreGoals = (registry: Registry) => {
  const goals = registry.getZipper([Goal, Position2D, HitboxRect2D]);

  registry
    .getZipper([Ball, Serve, Position2D, Velocity2D, HitboxRect2D])
    .forEach(({ Serve: serve, Position2D: ball, Velocity2D: velocity, HitboxRect2D: box }) => {
      const goal = goals.find(({ Position2D, HitboxRect2D }) =>
        overlap(ball, box, Position2D, HitboxRect2D),
      );
      if (!goal) return;
      goal.Goal.points++;
      ball.x = serve.x;
      ball.y = serve.y;
      velocity.x = 0;
      velocity.y = 0;
      serve.wait = serve.delay;
    });
};
