import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";

import { Position2D } from "../components/position-2d.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { CollisionBox } from "../components/collision-box.component";
import { resolveCollision } from "../collision-resolve";

const overlapsBox = (
  x1: number,
  y1: number,
  box1: CollisionBox,
  x2: number,
  y2: number,
  box2: CollisionBox,
): boolean => {
  return (
    x1 < x2 + box2.width && x1 + box1.width > x2 && y1 < y2 + box2.height && y1 + box1.height > y2
  );
};

/**
 * Stops the moving entities with a `CollisionBox` at the still ones (the lobby, the buildings):
 * the axis that ran into one is undone, and they slide along the other one. Runs after `move2D`.
 *
 * @system
 * @side server
 */
export const obstacleCollisionSystem = (registry: Registry, ctx: Context) => {
  const boxed = registry.getIndexedZipper([Position2D, CollisionBox]);
  const obstacles = boxed.filter(
    ({ id }) => !registry.getEntityComponent(registry.entityFromIndex(id), Velocity2D),
  );
  if (obstacles.length === 0) return;

  const delta = ctx.app.delta / 1000;
  const movers = registry.getIndexedZipper([Position2D, Velocity2D, CollisionBox]);

  for (const {
    id: entityId,
    Position2D: position,
    Velocity2D: velocity,
    CollisionBox: box,
  } of movers) {
    for (const obstacle of obstacles) {
      if (
        !overlapsBox(
          position.x,
          position.y,
          box,
          obstacle.Position2D.x,
          obstacle.Position2D.y,
          obstacle.CollisionBox,
        )
      )
        continue;

      resolveCollision(ctx, entityId, position, velocity, delta, (x, y) =>
        overlapsBox(x, y, box, obstacle.Position2D.x, obstacle.Position2D.y, obstacle.CollisionBox),
      );
      break;
    }
  }
};
