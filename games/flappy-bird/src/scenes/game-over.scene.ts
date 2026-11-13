import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { DrawOrder2D } from "../components/draw-order-2d.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Position2D } from "../components/position-2d.component";
import { RestartDelay } from "../components/restart-delay.component";
import { restart } from "../systems/restart.system";

/**
 * The game over screen, over the flight that ended. It has no parent of its own: it is loaded
 * over `Play` (`parent: "current"`), whose world stops while `over` exists.
 *
 * @scene
 * @side client
 * @vars over
 */
export class GameOver extends EcsScene {
  override setup(registry: Registry, ctx: Context) {
    ctx.scenes.vars.init("over", true);

    const title = registry.spawnEntity();
    registry.addComponent(title, new Position2D(114, 186));
    registry.addComponent(title, new DrawableRect2D(192, 42, "#ffffff", "/gameover.png"));
    registry.addComponent(title, new RestartDelay(0.4));
    registry.addComponent(title, new DrawOrder2D(6));

    registry.addSystem(restart);
  }
}
