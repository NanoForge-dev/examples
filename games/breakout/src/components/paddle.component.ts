/**
 * A paddle: it sends a `Ball` back, at a wider angle the further from its middle the ball hits
 * it. Walls stop it. Needs `Position2D` and `HitboxRect2D`, and the `bounceBall` and
 * `blockPaddles` systems.
 *
 * @example
 * The left paddle of a pong sends the ball to the right: `new Paddle(1, 0)`. A breakout paddle
 * sends it up: `new Paddle(0, -1)`.
 *
 * @component
 * @side shared
 * @group Bounce color=#4aa3ff - How the ball leaves the paddle.
 */
export class Paddle {
  name = "Paddle";

  constructor(
    /** Where the ball goes, hit in the middle: 1 to the right, -1 to the left. @group Bounce */
    public normalX = 0,
    /** Where the ball goes, hit in the middle: 1 down, -1 up. @group Bounce */
    public normalY = -1,
    /** Angle off that direction when hit at an end, in degrees. @group Bounce */
    public maxAngle = 60,
    /** The ball's speed is multiplied by it at each hit: 1 keeps it. @group Bounce */
    public speedUp = 1,
    /**
     * The most `speedUp` takes the ball to, in pixels per second. A faster ball goes through
     * walls in one frame on a slow machine. @group Bounce
     */
    public maxSpeed = 1600,
  ) {}
}
