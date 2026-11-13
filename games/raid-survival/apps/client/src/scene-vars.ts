import type { ServerMessage, ServerMessageOf } from "@raid-survival/shared/protocol";

/** The scene vars of the client, all persistent: they outlive the scene that sets them. */
declare module "@nanoforge-dev/scene" {
  interface SceneVars {
    /** Server entity id of this player's character, set when the lobby accepts them. */
    playerId: number;
    /** The `startGame` message, until `launchGame` builds the world from it. */
    start: ServerMessageOf<"startGame">;
    /** Messages received after a scene change, handled once the next scene is ready. */
    backlog: ServerMessage[];
    /** How the last game ended, shown by the game over scene. */
    result: { zombiesKilled: number; won: boolean };
  }
}

export {};
