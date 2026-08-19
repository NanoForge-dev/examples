import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Position } from "../components/position.component";
import { Velocity } from "../components/velocity.component";

export function moveSystem(registry: Registry, ctx: Context) {
  const entities = registry.getZipper([Position, Velocity]);

  entities.forEach(({ Position, Velocity }) => {
    Position.x += (Velocity.x * ctx.app.delta) / 1000;
    Position.y += (Velocity.y * ctx.app.delta) / 1000;
  });
}
// * Required to generate code
export default moveSystem.name;
