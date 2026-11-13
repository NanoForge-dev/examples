import { Layer } from "@nanoforge-dev/graphics-2d";

/**
 * The layers a game is drawn on: `world`, scaled and moved by the camera, and `hud`, fixed on
 * screen. `buildWorld` puts them on the stage; `destroy()` removes them, and gives the OS
 * cursor back, when the game scene is unloaded.
 *
 * @component
 * @side client
 */
export class GameView {
  name = "GameView";

  /** The map, the players, the zombies and the buildings. */
  readonly world = new Layer({ imageSmoothingEnabled: false });
  /** The screen-space interface: wave, money, ammo, shop, build bar and crosshair. */
  readonly hud = new Layer();

  constructor(
    /** Pixels on screen per world pixel, before the build mode's zoom. */
    public worldScale = 3,
  ) {}

  destroy(): void {
    const container = this.world.getStage()?.container();
    if (container) container.style.cursor = "default";
    this.world.destroy();
    this.hud.destroy();
  }
}
