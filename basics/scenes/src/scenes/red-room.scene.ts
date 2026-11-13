import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { DrawableText2D } from "../components/drawable-text-2d.component";
import { Position2D } from "../components/position-2d.component";

/**
 * The red room: a red panel and its title. Makes the `room` var, removed with the scene.
 *
 * @scene
 * @side client
 * @vars room
 */
export class RedRoom extends EcsScene {
  override setup(registry: Registry, ctx: Context) {
    ctx.scenes.vars.set("room", "red");

    const panel = registry.spawnEntity();
    registry.addComponent(panel, new Position2D(200, 150));
    registry.addComponent(panel, new DrawableRect2D(400, 300, "#f38ba8"));

    const title = registry.spawnEntity();
    registry.addComponent(title, new Position2D(310, 280));
    registry.addComponent(title, new DrawableText2D("Red room", 40, "#1e1e2e"));
  }
}
