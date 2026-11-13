import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";
import type { SceneLoadContext } from "@nanoforge-dev/scene";

import { DrawableText2D } from "../components/drawable-text-2d.component";
import { HudText } from "../components/hud-text.component";
import { Position2D } from "../components/position-2d.component";
import { recordBest } from "../record-best";
import { backToMenu } from "../systems/back-to-menu.system";
import { updateHud } from "../systems/update-hud.system";

/**
 * Shown when the last level is cleared, with the score and the best score.
 *
 * It is a root scene: loading it unloads the level and `Run`, whose vars (`score`, `lives`…)
 * go with them, so the score comes as a param.
 *
 * @scene
 * @side client
 * @vars best, score
 */
export class Victory extends EcsScene<{
  /** The score of the game that ended. */
  score: number;
}> {
  override setup(
    registry: Registry,
    ctx: Context,
    { params }: SceneLoadContext<{ score: number }>,
  ) {
    const score = params?.score ?? 0;
    recordBest(ctx, score);
    ctx.scenes.vars.init("score", score);

    const title = registry.spawnEntity();
    registry.addComponent(title, new Position2D(410, 200));
    registry.addComponent(title, new DrawableText2D("You win!", 96, "#6ab04c", 1, "monospace"));

    const scoreText = registry.spawnEntity();
    registry.addComponent(scoreText, new Position2D(532, 340));
    registry.addComponent(scoreText, new HudText("score"));
    registry.addComponent(scoreText, new DrawableText2D("", 40, "#e8ecf8", 1, "monospace"));

    const bestScore = registry.spawnEntity();
    registry.addComponent(bestScore, new Position2D(515, 400));
    registry.addComponent(bestScore, new HudText("best"));
    registry.addComponent(bestScore, new DrawableText2D("", 28, "#f9ca24", 1, "monospace"));

    const prompt = registry.spawnEntity();
    registry.addComponent(prompt, new Position2D(541, 520));
    registry.addComponent(prompt, new DrawableText2D("Press Enter", 30, "#8a93ad", 1, "monospace"));

    registry.addSystem(updateHud);
    registry.addSystem(backToMenu);
  }
}
