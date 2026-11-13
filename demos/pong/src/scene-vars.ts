/**
 * The scene vars of the game. A var belongs to the scene that made it, and goes away when that
 * scene is unloaded.
 */
declare module "@nanoforge-dev/scene" {
  interface SceneVars {
    /** Points a player needs to win the match (made by `Match`). @default 5 */
    pointsToWin: number;
    /** The player who won (made by `Win`). @default 1 */
    winner: number;
  }
}

export {};
