/**
 * Speed of an entity, in pixels per second, from the server: `moveSystem` moves it between two
 * messages.
 *
 * @component
 * @side client
 */
export class Velocity {
  name = "Velocity";

  constructor(
    /** Horizontal speed, in pixels per second. */
    public x: number,
    /** Vertical speed, in pixels per second. */
    public y: number,
  ) {}
}
