/**
 * The bird: it falls, flaps up when the player presses Space, clicks or taps, and dies on a pipe
 * or the ground. Needs `Position2D` (its center), `Velocity2D`, `DrawableRect2D` and the `flap`,
 * `fly` and `collide` systems.
 *
 * @component
 * @side client
 * @group Flight color=#f0a33a - How the bird moves.
 * @group Hit color=#eb4d4b - When the bird dies.
 */
export class Bird {
  name = "Bird";

  /** Whether it hit a pipe or the ground, set by `collide`. */
  dead = false;

  constructor(
    /** Added to the falling speed every second, in pixels per second, per second. @group Flight */
    public gravity = 1500,
    /** Upward speed of a flap, in pixels per second. @group Flight */
    public flapSpeed = 430,
    /** The fastest it falls, in pixels per second. @group Flight */
    public maxFallSpeed = 640,
    /** Pixels from the top of the screen to the ground. @group Hit */
    public groundY = 448,
    /** Part of its size left out of its hitbox on each side, from 0 to 0.5. @group Hit */
    public hitboxInset = 0.25,
  ) {}
}
