import type { Registry } from "@nanoforge-dev/ecs";

import { overlap, pushOut } from "../collisions";
import { Ball } from "../components/ball.component";
import { HitboxRect2D } from "../components/hitbox-rect-2d.component";
import { Paddle } from "../components/paddle.component";
import { Position2D } from "../components/position-2d.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { Wall } from "../components/wall.component";

/**
 * Bounces each `Ball` off the `Paddle` it moves into, or else off the first `Wall` it touches.
 * Add it after `move2D`.
 *
 * @remarks
 * Off a paddle, the ball leaves in the paddle's direction, turned toward the end it hit, up to
 * the paddle's `maxAngle`, and `speedUp` times faster. Off a wall, it goes back on the axis it
 * went in the least, and the wall counts a hit.
 *
 * @system
 * @side shared
 */
export const bounceBall = (registry: Registry) => {
  const paddles = registry.getZipper([Paddle, Position2D, HitboxRect2D]);
  const walls = registry.getZipper([Wall, Position2D, HitboxRect2D]);

  registry
    .getZipper([Ball, Position2D, Velocity2D, HitboxRect2D])
    .forEach(({ Position2D: ball, Velocity2D: velocity, HitboxRect2D: box }) => {
      const hit = paddles.find(
        ({ Paddle: paddle, Position2D, HitboxRect2D }) =>
          velocity.x * paddle.normalX + velocity.y * paddle.normalY < 0 &&
          overlap(ball, box, Position2D, HitboxRect2D),
      );
      if (hit) {
        const { Paddle: paddle, Position2D: at, HitboxRect2D: size } = hit;
        // Along the paddle: its normal turned a quarter clockwise.
        const alongX = -paddle.normalY;
        const alongY = paddle.normalX;
        const length = Math.abs(alongX) * size.width + Math.abs(alongY) * size.height;
        const offset =
          (alongX * (ball.x + box.width / 2 - at.x - size.width / 2) +
            alongY * (ball.y + box.height / 2 - at.y - size.height / 2)) /
          (length / 2);
        const angle = (Math.max(-1, Math.min(1, offset)) * paddle.maxAngle * Math.PI) / 180;
        const speed = Math.hypot(velocity.x, velocity.y) * paddle.speedUp;
        velocity.x = speed * (paddle.normalX * Math.cos(angle) + alongX * Math.sin(angle));
        velocity.y = speed * (paddle.normalY * Math.cos(angle) + alongY * Math.sin(angle));
        if (paddle.normalX > 0) ball.x = at.x + size.width;
        if (paddle.normalX < 0) ball.x = at.x - box.width;
        if (paddle.normalY > 0) ball.y = at.y + size.height;
        if (paddle.normalY < 0) ball.y = at.y - box.height;
        return;
      }

      const wall = walls.find(({ Position2D, HitboxRect2D }) =>
        overlap(ball, box, Position2D, HitboxRect2D),
      );
      if (!wall) return;
      pushOut(ball, box, velocity, wall.Position2D, wall.HitboxRect2D, true);
      wall.Wall.hits++;
    });
};
