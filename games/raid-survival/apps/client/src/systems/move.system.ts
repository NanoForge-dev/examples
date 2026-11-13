import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";

import { TransformComponent } from "../components/transform.component";
import { Velocity } from "../components/velocity.component";

export const moveSystem = (registry: Registry, ctx: Context) => {
  const entities = registry.getZipper([TransformComponent, Velocity]);

  entities.forEach(({ TransformComponent, Velocity }) => {
    TransformComponent.x += (Velocity.x * ctx.app.delta) / 1000;
    TransformComponent.y += (Velocity.y * ctx.app.delta) / 1000;
  });
};
