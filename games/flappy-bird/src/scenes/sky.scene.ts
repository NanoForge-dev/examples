import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { DrawOrder2D } from "../components/draw-order-2d.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Position2D } from "../components/position-2d.component";
import { ScrollLoop } from "../components/scroll-loop.component";
import { scrollGround } from "../systems/scroll-ground.system";

/**
 * The world every screen is drawn in: the sky and the scrolling ground. `Ready` and `Play` are
 * loaded under it. The ground tiles are 336 pixels apart and one pixel wider, so that no seam
 * shows between them.
 *
 * It must not import them (or anything that does): they name it as their parent when their
 * module is evaluated.
 *
 * @scene
 * @side client
 */
export class Sky extends EcsScene {
  override setup(registry: Registry, _ctx: Context) {
    const background = registry.spawnEntity();
    registry.addComponent(background, new Position2D(0, 0));
    registry.addComponent(
      background,
      new DrawableRect2D(420, 560, "#4ec0ca", "/background-day.png"),
    );
    registry.addComponent(background, new DrawOrder2D(0));

    const ground1 = registry.spawnEntity();
    registry.addComponent(ground1, new Position2D(0, 448));
    registry.addComponent(ground1, new DrawableRect2D(337, 112, "#ded895", "/base.png"));
    registry.addComponent(ground1, new ScrollLoop(150, 1008));
    registry.addComponent(ground1, new DrawOrder2D(2));

    const ground2 = registry.spawnEntity();
    registry.addComponent(ground2, new Position2D(336, 448));
    registry.addComponent(ground2, new DrawableRect2D(337, 112, "#ded895", "/base.png"));
    registry.addComponent(ground2, new ScrollLoop(150, 1008));
    registry.addComponent(ground2, new DrawOrder2D(2));

    const ground3 = registry.spawnEntity();
    registry.addComponent(ground3, new Position2D(672, 448));
    registry.addComponent(ground3, new DrawableRect2D(337, 112, "#ded895", "/base.png"));
    registry.addComponent(ground3, new ScrollLoop(150, 1008));
    registry.addComponent(ground3, new DrawOrder2D(2));

    registry.addSystem(scrollGround);
  }
}
