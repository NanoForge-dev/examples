import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { DrawOrder2D } from "../components/draw-order-2d.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Position2D } from "../components/position-2d.component";
import { startFlight } from "../systems/start-flight.system";
import { Sky } from "./sky.scene";

/**
 * The title screen: the "get ready" message and the bird, waiting for the first flap.
 *
 * @scene
 * @side client
 */
export class Ready extends EcsScene {
  static override parent = Sky;

  override setup(registry: Registry, _ctx: Context) {
    const message = registry.spawnEntity();
    registry.addComponent(message, new Position2D(118, 100));
    registry.addComponent(message, new DrawableRect2D(184, 267, "#ffffff", "/message.png"));
    registry.addComponent(message, new DrawOrder2D(4));

    const bird = registry.spawnEntity();
    registry.addComponent(bird, new Position2D(43, 268));
    registry.addComponent(bird, new DrawableRect2D(34, 24, "#f8e71c", "/yellowbird-midflap.png"));
    registry.addComponent(bird, new DrawOrder2D(3));

    registry.addSystem(startFlight);
  }
}
