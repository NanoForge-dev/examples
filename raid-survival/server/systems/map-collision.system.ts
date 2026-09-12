import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Position } from "../components/position.component";
import { Velocity } from "../components/velocity.component";
import { CollisionBox } from "../components/collision-box.component";
import { MapCollisions } from "../components/map-collisions.component";
import { resolveCollision } from "./collision-resolve";

function overlapsTree(map: MapCollisions, x: number, y: number, box: CollisionBox): boolean {
  const corners: [number, number][] = [
    [x, y],
    [x + box.width, y],
    [x, y + box.height],
    [x + box.width, y + box.height],
  ];

  return corners.some(([cornerX, cornerY]) => {
    const cellX = Math.floor(cornerX / map.tileSize);
    const cellY = Math.floor(cornerY / map.tileSize);
    return map.isTreeCell(cellX, cellY);
  });
}

export function mapCollisionSystem(registry: Registry, ctx: Context) {
  const maps = registry.getZipper([MapCollisions]);
  const map = maps[0]?.MapCollisions;
  if (!map) return;

  const delta = ctx.app.delta / 1000;
  const entities = registry.getIndexedZipper([Position, Velocity, CollisionBox]);

  for (const {
    id: entityId,
    Position: position,
    Velocity: velocity,
    CollisionBox: box,
  } of entities) {
    if (!overlapsTree(map, position.x, position.y, box)) continue;

    resolveCollision(ctx, entityId, position, velocity, delta, (x, y) =>
      overlapsTree(map, x, y, box),
    );
  }
}

// * Required to generate code
export default mapCollisionSystem.name;
