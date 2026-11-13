import type { ScreenView } from "../views/screen-view";

/**
 * The screen a menu scene shows. Spawned by the scene's system on its first tick, which then
 * ticks it; `destroy()` unloads it when the scene is unloaded.
 *
 * @component
 * @side client
 */
export class Screen {
  name = "Screen";

  constructor(
    /** The screen, built on the first tick. */
    public view: ScreenView,
  ) {}

  destroy(): void {
    this.view.unload();
  }
}
