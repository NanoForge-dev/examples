import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";

/** A screen built by hand on its own layer (the menu, the game over screen). */
export interface ScreenView {
  /** Builds the screen: its layer and its entities. */
  load(registry: Registry, ctx: Context): void;
  /** Updates the screen, every tick. */
  tick(registry: Registry, ctx: Context): void;
  /** Removes what `registry.clearEntities()` doesn't: its layer and its DOM nodes. */
  unload(): void;
}
