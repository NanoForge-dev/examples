/** Where the server is: players gather in the lobby, play, then see the end screen. */
export type GameStatus = "lobby" | "inGame" | "endScreen";

/**
 * The server's state, on one entity. A game starts from `lobby` or `endScreen`, never while one
 * is running.
 *
 * @component
 * @side server
 */
export class GameState {
  name = "GameState";

  constructor(
    /** Lobby, in game or end screen. */
    public status: GameStatus = "lobby",
  ) {}
}
