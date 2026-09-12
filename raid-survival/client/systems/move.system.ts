import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { TransformComponent } from "../components/essentials/transform.component";
import { Velocity } from "../components/essentials/velocity.component";

export function moveSystem(registry: Registry, ctx: Context) {
  const entities = registry.getZipper([TransformComponent, Velocity]);

  entities.forEach(({ TransformComponent, Velocity }) => {
    TransformComponent.x += (Velocity.x * ctx.app.delta) / 1000;
    TransformComponent.y += (Velocity.y * ctx.app.delta) / 1000;
  });
}
// * Required to generate code
export default moveSystem.name;
