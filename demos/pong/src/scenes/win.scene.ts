import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";
import type { SceneLoadContext } from "@nanoforge-dev/scene";

import { DrawableText2D } from "../components/drawable-text-2d.component";
import { Position2D } from "../components/position-2d.component";
import { WinnerText } from "../components/winner-text.component";
import { backToMenu } from "../systems/back-to-menu.system";
import { showWinner } from "../systems/show-winner.system";

/**
 * Shown when a player wins the match. Enter goes back to the menu.
 *
 * @scene
 * @side client
 * @vars winner
 */
export class Win extends EcsScene<{
  /** The player who won. */
  player: number;
}> {
  override setup(
    registry: Registry,
    ctx: Context,
    { params }: SceneLoadContext<{ player: number }>,
  ) {
    ctx.scenes.vars.init("winner", params?.player ?? 1);

    const title = registry.spawnEntity();
    registry.addComponent(title, new Position2D(560, 380));
    registry.addComponent(title, new WinnerText());
    registry.addComponent(title, new DrawableText2D("", 100, "#a6e3a1", 1, "monospace"));

    const prompt = registry.spawnEntity();
    registry.addComponent(prompt, new Position2D(840, 600));
    registry.addComponent(prompt, new DrawableText2D("Press Enter", 48, "#8a93ad", 1, "monospace"));

    registry.addSystem(showWinner);
    registry.addSystem(backToMenu);
  }
}
