import type { HitboxRect2D } from "./components/hitbox-rect-2d.component";
import type { Position2D } from "./components/position-2d.component";
import type { Velocity2D } from "./components/velocity-2d.component";

/** Whether two hitboxes overlap (touching edges don't). */
export const overlap = (a: Position2D, aBox: HitboxRect2D, b: Position2D, bBox: HitboxRect2D) =>
  a.x < b.x + bBox.width &&
  a.x + aBox.width > b.x &&
  a.y < b.y + bBox.height &&
  a.y + aBox.height > b.y;

/**
 * Pushes `a` out of `b` on the axis it went in the least. On that axis, its velocity turns away
 * from `b` when it `bounces`, and stops otherwise.
 */
export const pushOut = (
  a: Position2D,
  aBox: HitboxRect2D,
  velocity: Velocity2D,
  b: Position2D,
  bBox: HitboxRect2D,
  bounces: boolean,
) => {
  const left = a.x + aBox.width - b.x;
  const right = b.x + bBox.width - a.x;
  const up = a.y + aBox.height - b.y;
  const down = b.y + bBox.height - a.y;
  const axis = Math.min(left, right) < Math.min(up, down) ? "x" : "y";
  const back = axis === "x" ? left < right : up < down;
  a[axis] += back ? -(axis === "x" ? left : up) : axis === "x" ? right : down;
  velocity[axis] = bounces ? (back ? -1 : 1) * Math.abs(velocity[axis]) : 0;
};
