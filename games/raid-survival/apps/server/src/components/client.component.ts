/**
 * A player who joined the lobby, on the entity that becomes their character when the game starts.
 * Kept while they are disconnected, so they can rejoin under the same name.
 *
 * @component
 * @side server
 */
export class Client {
  name = "Client";

  constructor(
    /** The network session of the player (`ClientId`). */
    public clientId = "",
    /** The name they joined with, unique in the lobby. */
    public username = "",
    /** Their character, from 1 to 3: it also sets their class. */
    public skin = 1,
    /** Whether their session is still open. */
    public connected = true,
  ) {}
}
