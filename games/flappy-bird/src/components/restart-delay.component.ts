/**
 * How long the game over screen waits before a flap restarts the game, so that a flap made just
 * as the bird died doesn't. Needs the `restart` system.
 *
 * @component
 * @side client
 * @group Restart color=#eb4d4b - The wait before a restart.
 */
export class RestartDelay {
  name = "RestartDelay";

  /** Seconds since the game over screen came. */
  elapsed = 0;

  constructor(
    /** In seconds. @group Restart */
    public seconds = 0.4,
  ) {}
}
