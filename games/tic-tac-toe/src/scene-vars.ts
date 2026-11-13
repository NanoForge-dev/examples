/**
 * The scene vars of the game. A var belongs to the scene that made it, and goes away when that
 * scene is unloaded.
 */
declare module "@nanoforge-dev/scene" {
  interface SceneVars {
    /** Whose turn it is: 1 (X) or 2 (O) (made by `Match`). @default 1 */
    player: number;
    /** How the match ended, or "" while it goes on (made by `Match`). @default "" */
    result: string;
    /** The match is over: the board takes no more marks (made by `EndPopup`). @default true */
    over: boolean;
  }
}

export {};
