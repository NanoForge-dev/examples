import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { DrawableText2D } from "../components/drawable-text-2d.component";
import { Position2D } from "../components/position-2d.component";
import { pauseMenu } from "../systems/pause-menu.system";

/**
 * The pause menu. It has no parent of its own: it is loaded over the current level
 * (`parent: "current"`), so unloading it goes back to that level as it was.
 *
 * @scene
 * @side client
 * @vars paused
 */
export class Pause extends EcsScene {
  override setup(registry: Registry, ctx: Context) {
    // The game's systems stop while it exists, and it goes with this scene.
    ctx.scenes.vars.init("paused", true);

    const shade = registry.spawnEntity();
    registry.addComponent(shade, new Position2D(0, 0));
    registry.addComponent(shade, new DrawableRect2D(1280, 720, "rgba(8, 10, 18, 0.72)"));

    const title = registry.spawnEntity();
    registry.addComponent(title, new Position2D(510, 250));
    registry.addComponent(title, new DrawableText2D("Paused", 72, "#e8ecf8", 1, "monospace"));

    const keys = registry.spawnEntity();
    registry.addComponent(keys, new Position2D(316, 370));
    registry.addComponent(
      keys,
      new DrawableText2D("Esc  resume      Q  quit to the menu", 30, "#8a93ad", 1, "monospace"),
    );

    registry.addSystem(pauseMenu);
  }
}
