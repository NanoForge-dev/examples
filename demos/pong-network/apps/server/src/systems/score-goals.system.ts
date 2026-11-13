import type { Registry } from "@nanoforge-dev/ecs";

import { overlap } from "../collisions";
import { Ball } from "../components/ball.component";
import { Goal } from "../components/goal.component";
import { HitboxRect2D } from "../components/hitbox-rect-2d.component";
import { Position2D } from "../components/position-2d.component";
import { Serve } from "../components/serve.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { Wall } from "../components/wall.component";

type Box = { Position2D: Position2D; HitboxRect2D: HitboxRect2D };

/** The goal nearest to (`x`, `y`) among those that span it on one axis, if any. */
const goalAcross = <T extends Box>(goals: T[], x: number, y: number): T | undefined => {
  let nearest: T | undefined;
  let best = Infinity;
  for (const goal of goals) {
    const { Position2D: at, HitboxRect2D: size } = goal;
    const across = (x >= at.x && x <= at.x + size.width) || (y >= at.y && y <= at.y + size.height);
    const distance = Math.hypot(at.x + size.width / 2 - x, at.y + size.height / 2 - y);
    if (across && distance < best) {
      best = distance;
      nearest = goal;
    }
  }
  return nearest;
};

/**
 * Gives a point to a `Goal`'s player when a `Ball` enters it, and puts the ball back where its
 * `Serve` says, to be served again. Add it after `move2D`.
 *
 * @remarks
 * A ball whose center left the field (the box around every `Wall` and `Goal`) is served again
 * too: a long frame (a hidden tab) can move it past a goal or a wall without touching it. It
 * scores in the nearest goal it is in line with, past its goal line; through a wall, nobody
 * scores.
 *
 * @system
 * @side shared
 */
export const scoreGoals = (registry: Registry) => {
  const goals = registry.getZipper([Goal, Position2D, HitboxRect2D]);
  const walls = registry.getZipper([Wall, Position2D, HitboxRect2D]);

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  const grow = ({ Position2D: at, HitboxRect2D: size }: Box) => {
    left = Math.min(left, at.x);
    top = Math.min(top, at.y);
    right = Math.max(right, at.x + size.width);
    bottom = Math.max(bottom, at.y + size.height);
  };
  goals.forEach(grow);
  walls.forEach(grow);

  registry
    .getZipper([Ball, Serve, Position2D, Velocity2D, HitboxRect2D])
    .forEach(({ Serve: serve, Position2D: ball, Velocity2D: velocity, HitboxRect2D: box }) => {
      const x = ball.x + box.width / 2;
      const y = ball.y + box.height / 2;
      const out = left <= right && (x < left || x > right || y < top || y > bottom);
      const goal =
        goals.find(({ Position2D, HitboxRect2D }) =>
          overlap(ball, box, Position2D, HitboxRect2D),
        ) ?? (out ? goalAcross(goals, x, y) : undefined);
      if (!goal && !out) return;
      if (goal) goal.Goal.points++;
      ball.x = serve.x;
      ball.y = serve.y;
      velocity.x = 0;
      velocity.y = 0;
      serve.wait = serve.delay;
    });
};
