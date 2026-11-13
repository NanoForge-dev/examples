import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { DrawableText2D } from "../components/drawable-text-2d.component";
import { Position2D } from "../components/position-2d.component";

/**
 * The blue room: a blue panel and its title. Makes the `room` var, removed with the scene.
 *
 * @scene
 * @side client
 * @vars room
 */
export class BlueRoom extends EcsScene {
  override setup(registry: Registry, ctx: Context) {
    ctx.scenes.vars.set("room", "blue");

    const panel = registry.spawnEntity();
    registry.addComponent(panel, new Position2D(200, 150));
    registry.addComponent(panel, new DrawableRect2D(400, 300, "#89b4fa"));

    const title = registry.spawnEntity();
    registry.addComponent(title, new Position2D(300, 280));
    registry.addComponent(title, new DrawableText2D("Blue room", 40, "#1e1e2e"));
  }
}
