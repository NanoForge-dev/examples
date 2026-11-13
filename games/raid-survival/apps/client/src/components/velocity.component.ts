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
    public x: number,
    public y: number,
  ) {}
}
