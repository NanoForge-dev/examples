/**
 * Marks a player in the game, with the name they joined with.
 *
 * @component
 * @side server
 */
export class Login {
  name = "Login";

  constructor(
    /** The player's username. */
    public id = "",
  ) {}
}
