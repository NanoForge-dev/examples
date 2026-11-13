/**
 * The scene vars of the game. A var belongs to the scene that made it, and goes away when that
 * scene is unloaded.
 */
declare module "@nanoforge-dev/scene" {
  interface SceneVars {
    /** Pipes passed in the current flight (made by `Play`). @default 0 */
    score: number;
    /** The bird died: the world stops (made by `GameOver`). @default true */
    over: boolean;
  }
}

export {};
