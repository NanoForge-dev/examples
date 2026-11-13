/**
 * The scene vars of the game, typed for `ctx.scenes.vars`. A var belongs to the scene that made
 * it and goes away when that scene is unloaded, unless it is persistent.
 */
declare module "@nanoforge-dev/scene" {
  interface SceneVars {
    /** Scene switches since the game started, kept across scenes (persistent). @default 0 */
    switches: number;
    /** Name of the room on screen, made by each room and removed with it. @default "" */
    room: string;
  }
}

export {};
