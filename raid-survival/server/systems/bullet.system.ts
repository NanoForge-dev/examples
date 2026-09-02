import { type Registry } from "@nanoforge-dev/ecs-client";
import { type Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { Bullet } from "../components/bullet.component";
import { Position } from "../components/position.component";
import { Hitbox } from "../components/hitbox.component";
import { Health } from "../components/health.component";
import { Zombie } from "../components/zombie.component";
import { MapCollisions } from "../components/map-collisions.component";
import { sendToInGamePlayers } from "../network-utils";

function overlapsHitbox(x: number, y: number, position: Position, hitbox: Hitbox): boolean {
  const left = position.x + hitbox.offsetX;
  const top = position.y + hitbox.offsetY;
  return x >= left && x <= left + hitbox.width && y >= top && y <= top + hitbox.height;
}

// Runs after move.system.ts has already advanced every bullet's Position this tick (Bullet only
// needs Position+Velocity to move, which move.system.ts already drives generically - this only
// owns what stops a bullet). A bullet is a point, not a box - it doesn't need its own Hitbox,
// just to fall inside whatever it's checked against.
export function bulletSystem(registry: Registry, ctx: Context) {
  const bullets: { id: number; Bullet: Bullet; Position: Position }[] = registry.getIndexedZipper([Bullet, Position]);
  if (bullets.length === 0) return;

  const maps: { MapCollisions: MapCollisions }[] = registry.getZipper([MapCollisions]);
  const map = maps[0]?.MapCollisions;

  const zombies: { id: number; Zombie: Zombie; Position: Position; Hitbox: Hitbox; Health: Health }[] =
    registry.getIndexedZipper([Zombie, Position, Hitbox, Health]);

  const network = ctx.libs.getNetwork<NetworkServerLibrary>();

  for (const bullet of bullets) {
    const { x, y } = bullet.Position;

    if (map) {
      const mapWidth = map.cols * map.tileSize;
      const mapHeight = map.rows * map.tileSize;
      // Bounded, not a contradiction of "continue infinitely" - the map itself has an edge, and
      // a bullet with nothing left it could ever hit out there would otherwise never despawn.
      if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) {
        sendToInGamePlayers(network, { type: "kill", id: bullet.id });
        registry.killEntity(registry.entityFromIndex(bullet.id));
        continue;
      }

      const cellX = Math.floor(x / map.tileSize);
      const cellY = Math.floor(y / map.tileSize);
      if (map.isTreeCell(cellX, cellY)) {
        sendToInGamePlayers(network, { type: "kill", id: bullet.id });
        registry.killEntity(registry.entityFromIndex(bullet.id));
        continue;
      }
    }

    const hitZombie = zombies.find(
      (z) => z.Health.current > 0 && !z.Zombie.dying && overlapsHitbox(x, y, z.Position, z.Hitbox),
    );
    if (hitZombie) {
      sendToInGamePlayers(network, { type: "kill", id: bullet.id });
      registry.killEntity(registry.entityFromIndex(bullet.id));
      // The `hit` packet is broadcast-only (client display) - the authoritative damage has to be
      // applied here, same as zombie-ai.ts's attack does to players/the lobby. Without this,
      // zombie-death.system.ts's `Health.current <= 0` check never fires.
      hitZombie.Health.current = Math.max(0, hitZombie.Health.current - bullet.Bullet.damage);
      sendToInGamePlayers(network, { type: "hit", id: hitZombie.id, damage: bullet.Bullet.damage });
    }
  }
}

// * Required to generate code
export default bulletSystem.name;
