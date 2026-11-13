/**
 * A player's square, moved by the client that owns it. The server spawns it when the client
 * joins, and kills it when the client leaves.
 *
 * @component
 * @side server
 */
export class Player {
  name = "Player";

  constructor(
    /** The client that moves it, as `ctx.network` names it. */
    public clientId = "",
  ) {}
}
