import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { DrawableText2D } from "../components/drawable-text-2d.component";
import { HudText } from "../components/hud-text.component";
import { Position2D } from "../components/position-2d.component";
import { startOnEnter } from "../systems/start-on-enter.system";
import { updateHud } from "../systems/update-hud.system";

/**
 * The title screen. Enter starts a game at level 1, which loads `Run` first.
 *
 * @scene
 * @side client
 * @vars best
 */
export class Menu extends EcsScene {
  override setup(registry: Registry, ctx: Context) {
    // Persistent: kept from one game to the next, while every other var goes with its scene.
    ctx.scenes.vars.init("best", 0, { persistent: true });

    const title = registry.spawnEntity();
    registry.addComponent(title, new Position2D(376, 170));
    registry.addComponent(title, new DrawableText2D("BREAKOUT", 110, "#4aa3ff", 1, "monospace"));

    const prompt = registry.spawnEntity();
    registry.addComponent(prompt, new Position2D(435, 360));
    registry.addComponent(
      prompt,
      new DrawableText2D("Press Enter to play", 36, "#e8ecf8", 1, "monospace"),
    );

    const bestScore = registry.spawnEntity();
    registry.addComponent(bestScore, new Position2D(515, 430));
    registry.addComponent(bestScore, new HudText("best"));
    registry.addComponent(bestScore, new DrawableText2D("", 28, "#f9ca24", 1, "monospace"));

    const keys = registry.spawnEntity();
    registry.addComponent(keys, new Position2D(395, 600));
    registry.addComponent(
      keys,
      new DrawableText2D("← → move   Space serve   Esc pause", 24, "#8a93ad", 1, "monospace"),
    );

    registry.addSystem(startOnEnter);
    registry.addSystem(updateHud);
  }
}
