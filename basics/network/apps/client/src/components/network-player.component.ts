/**
 * A player as the server last sent it. The `showPlayers` system spawns, moves and kills these
 * entities.
 *
 * @component
 * @side client
 */
export class NetworkPlayer {
  name = "NetworkPlayer";

  constructor(
    /** The client that moves it, as the server names it. */
    public clientId = "",
  ) {}
}
