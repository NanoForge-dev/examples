import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Position } from "../components/position.component";
import { Velocity } from "../components/velocity.component";
import { CollisionBox } from "../components/collision-box.component";
import { resolveCollision } from "./collision-resolve";

function overlapsBox(
  x1: number,
  y1: number,
  box1: CollisionBox,
  x2: number,
  y2: number,
  box2: CollisionBox,
): boolean {
  return x1 < x2 + box2.width && x1 + box1.width > x2 && y1 < y2 + box2.height && y1 + box1.height > y2;
}

export function obstacleCollisionSystem(registry: Registry, ctx: Context) {
  const boxed = registry.getIndexedZipper([Position, CollisionBox]);
  const obstacles = boxed.filter(
    ({ id }) => !registry.getEntityComponent(registry.entityFromIndex(id), Velocity),
  );
  if (obstacles.length === 0) return;

  const delta = ctx.app.delta / 1000;
  const movers = registry.getIndexedZipper([Position, Velocity, CollisionBox]);

  for (const {
    id: entityId,
    Position: position,
    Velocity: velocity,
    CollisionBox: box,
  } of movers) {
    for (const obstacle of obstacles) {
      if (
        !overlapsBox(position.x, position.y, box, obstacle.Position.x, obstacle.Position.y, obstacle.CollisionBox)
      )
        continue;

      resolveCollision(ctx, entityId, position, velocity, delta, (x, y) =>
        overlapsBox(x, y, box, obstacle.Position.x, obstacle.Position.y, obstacle.CollisionBox),
      );
      break;
    }
  }
}

// * Required to generate code
export default obstacleCollisionSystem.name;
