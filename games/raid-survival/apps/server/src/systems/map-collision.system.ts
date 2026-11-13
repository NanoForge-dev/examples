import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";

import { Position2D } from "../components/position-2d.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { CollisionBox } from "../components/collision-box.component";
import { MapCollisions } from "../components/map-collisions.component";
import { resolveCollision } from "../collision-resolve";

const overlapsTree = (map: MapCollisions, x: number, y: number, box: CollisionBox): boolean => {
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
};

/**
 * TODO
 *
 * @system
 * @side server
 */
export const mapCollisionSystem = (registry: Registry, ctx: Context) => {
  const maps = registry.getZipper([MapCollisions]);
  const map = maps[0]?.MapCollisions;
  if (!map) return;

  const delta = ctx.app.delta / 1000;
  const entities = registry.getIndexedZipper([Position2D, Velocity2D, CollisionBox]);

  for (const {
    id: entityId,
    Position2D: position,
    Velocity2D: velocity,
    CollisionBox: box,
  } of entities) {
    if (!overlapsTree(map, position.x, position.y, box)) continue;

    resolveCollision(ctx, entityId, position, velocity, delta, (x, y) =>
      overlapsTree(map, x, y, box),
    );
  }
};
