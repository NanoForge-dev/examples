import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { Serve } from "../components/serve.component";
import { Velocity2D } from "../components/velocity-2d.component";

/**
 * Serves each `Serve` entity once its wait is over: horizontally, at its speed, toward each side
 * in turn.
 *
 * @system
 * @side shared
 */
export const serveBall = (registry: Registry, ctx: Context) => {
  registry.getZipper([Serve, Velocity2D]).forEach(({ Serve: serve, Velocity2D: velocity }) => {
    if (serve.wait <= 0) return;
    serve.wait -= ctx.app.delta / 1000;
    if (serve.wait > 0) return;
    serve.wait = 0;
    velocity.x = serve.side * serve.speed;
    velocity.y = 0;
    serve.side = -serve.side;
  });
};
