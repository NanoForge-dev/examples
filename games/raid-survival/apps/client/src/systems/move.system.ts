import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";

import { TransformComponent } from "../components/transform.component";
import { Velocity2D } from "../components/velocity-2d.component";

export const moveSystem = (registry: Registry, ctx: Context) => {
  const entities = registry.getZipper([TransformComponent, Velocity2D]);

  entities.forEach(({ TransformComponent, Velocity2D }) => {
    TransformComponent.x += (Velocity2D.x * ctx.app.delta) / 1000;
    TransformComponent.y += (Velocity2D.y * ctx.app.delta) / 1000;
  });
};
