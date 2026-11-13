/**
 * A ball: it bounces off `Paddle` and `Wall` entities, and scores in `Goal` entities. Needs
 * `Position2D`, `Velocity2D`, `HitboxRect2D` and the `bounceBall` system.
 *
 * @component
 * @side shared
 */
export class Ball {
  name = "Ball";
}
