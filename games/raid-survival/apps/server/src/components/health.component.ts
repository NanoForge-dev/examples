/**
 * Hit points of a player, a zombie, a building or the lobby.
 *
 * @component
 * @side server
 */
export class Health {
  name = "Health";

  constructor(
    /** Hit points left. */
    public current = 100,
    /** Hit points when full. */
    public max = 100,
  ) {}
}
