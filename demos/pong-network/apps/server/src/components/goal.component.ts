/**
 * A goal: a `Ball` that enters it gives a point to `player`, and is served again. Needs
 * `Position2D`, `HitboxRect2D` and the `scoreGoals` system.
 *
 * @component
 * @side shared
 */
export class Goal {
  name = "Goal";

  /** Points scored in this goal, added by `scoreGoals`. */
  points = 0;

  constructor(
    /** The player who scores when the ball enters it. */
    public player = 1,
  ) {}
}
