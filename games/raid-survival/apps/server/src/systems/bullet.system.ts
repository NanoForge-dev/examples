import type { Registry } from "@nanoforge-dev/ecs/server";
import type { Context } from "@nanoforge-dev/common";

import { Bullet } from "../components/bullet.component";
import { Position2D } from "../components/position-2d.component";
import { Hitbox } from "../components/hitbox.component";
import { Health } from "../components/health.component";
import { Zombie } from "../components/zombie.component";
import { MapCollisions } from "../components/map-collisions.component";
import { broadcast } from "../broadcast";

const overlapsHitbox = (x: number, y: number, position: Position2D, hitbox: Hitbox): boolean => {
  const left = position.x + hitbox.offsetX;
  const top = position.y + hitbox.offsetY;
  return x >= left && x <= left + hitbox.width && y >= top && y <= top + hitbox.height;
};

/**
 * Runs after move.system.ts has advanced every bullet's Position2D this tick - this only owns what
 * stops a bullet. A bullet is a point, not a box, so it's checked against other hitboxes directly.
 *
 * @system
 * @side server
 */
export const bulletSystem = (registry: Registry, ctx: Context) => {
  const bullets: { id: number; Bullet: Bullet; Position2D: Position2D }[] = registry.getIndexedZipper([Bullet, Position2D]);
  if (bullets.length === 0) return;

  const maps: { MapCollisions: MapCollisions }[] = registry.getZipper([MapCollisions]);
  const map = maps[0]?.MapCollisions;

  const zombies: { id: number; Zombie: Zombie; Position2D: Position2D; Hitbox: Hitbox; Health: Health }[] =
    registry.getIndexedZipper([Zombie, Position2D, Hitbox, Health]);

  for (const bullet of bullets) {
    const { x, y } = bullet.Position2D;

    if (map) {
      const mapWidth = map.cols * map.tileSize;
      const mapHeight = map.rows * map.tileSize;
      // Despawn at the map edge - otherwise a bullet that never hits anything would fly forever.
      if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) {
        broadcast(ctx, { type: "kill", id: bullet.id });
        registry.killEntity(registry.entityFromIndex(bullet.id));
        continue;
      }

      const cellX = Math.floor(x / map.tileSize);
      const cellY = Math.floor(y / map.tileSize);
      if (map.isTreeCell(cellX, cellY)) {
        broadcast(ctx, { type: "kill", id: bullet.id });
        registry.killEntity(registry.entityFromIndex(bullet.id));
        continue;
      }
    }

    const hitZombie = zombies.find(
      (z) => z.Health.current > 0 && !z.Zombie.dying && overlapsHitbox(x, y, z.Position2D, z.Hitbox),
    );
    if (hitZombie) {
      broadcast(ctx, { type: "kill", id: bullet.id });
      registry.killEntity(registry.entityFromIndex(bullet.id));
      // Damage must be applied here, not just broadcast - the `hit` packet is display-only.
      hitZombie.Health.current = Math.max(0, hitZombie.Health.current - bullet.Bullet.damage);
      broadcast(ctx, { type: "hit", id: hitZombie.id, damage: bullet.Bullet.damage });
    }
  }
};
