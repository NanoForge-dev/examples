import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { CenterText2D } from "../components/center-text-2d.component";
import { Clickable2D } from "../components/clickable-2d.component";
import { DrawOrder2D } from "../components/draw-order-2d.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { DrawableText2D } from "../components/drawable-text-2d.component";
import { Position2D } from "../components/position-2d.component";
import { RestartButton } from "../components/restart-button.component";
import { VarText } from "../components/var-text.component";
import { restartMatch } from "../systems/restart-match.system";

/**
 * The end of a match: who won, or a draw, and a button to play again. It has no parent of its
 * own: it is loaded over `Match` (`parent: "current"`), whose board stays under it.
 *
 * @scene
 * @side client
 * @vars over, result
 */
export class EndPopup extends EcsScene {
  override setup(registry: Registry, ctx: Context) {
    ctx.scenes.vars.init("over", true);

    const shade = registry.spawnEntity();
    registry.addComponent(shade, new Position2D(0, 0));
    registry.addComponent(shade, new DrawableRect2D(700, 700, "#000000", "", 0.6));
    registry.addComponent(shade, new DrawOrder2D(10));

    const panel = registry.spawnEntity();
    registry.addComponent(panel, new Position2D(125, 225));
    registry.addComponent(panel, new DrawableRect2D(450, 250, "#23233a", "", 1, 0, 15));
    registry.addComponent(panel, new DrawOrder2D(11));

    const title = registry.spawnEntity();
    registry.addComponent(title, new Position2D(350, 290));
    registry.addComponent(title, new DrawableText2D("", 28, "#ffffff"));
    registry.addComponent(title, new VarText("result", "{}"));
    registry.addComponent(title, new CenterText2D());
    registry.addComponent(title, new DrawOrder2D(12));

    const button = registry.spawnEntity();
    registry.addComponent(button, new Position2D(290, 385));
    registry.addComponent(button, new DrawableRect2D(120, 60, "#7644aa", "", 1, 0, 10));
    registry.addComponent(button, new Clickable2D("#7644aa", "#8f5cc7"));
    registry.addComponent(button, new RestartButton());
    registry.addComponent(button, new DrawOrder2D(12));

    const label = registry.spawnEntity();
    registry.addComponent(label, new Position2D(350, 415));
    registry.addComponent(label, new DrawableText2D("Restart", 24, "#ffffff"));
    registry.addComponent(label, new CenterText2D());
    registry.addComponent(label, new DrawOrder2D(13));

    registry.addSystem(restartMatch);
  }
}
