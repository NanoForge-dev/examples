/**
 * A wall: a `Ball` bounces off it, and a `Paddle` can't go through it. Needs `Position2D` and
 * `HitboxRect2D`.
 *
 * @remarks
 * `hits` counts the bounces, for a system that breaks bricks.
 *
 * @component
 * @side shared
 */
export class Wall {
  name = "Wall";

  /** Bounces of a ball off this wall, added by `bounceBall`. Set it back to 0 once handled. */
  hits = 0;
}
