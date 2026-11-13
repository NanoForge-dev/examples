import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";

import { Building } from "../components/building.component";
import { Tower } from "../components/tower.component";
import { Position2D } from "../components/position-2d.component";
import { Hitbox } from "../components/hitbox.component";
import { Health } from "../components/health.component";
import { Zombie } from "../components/zombie.component";
import { WEAPON_CATALOG } from "@raid-survival/shared/weapon-catalog";
import { firePellets } from "../fire-pellets";
import { TOWER_RANGE } from "@raid-survival/shared/tower";
import { distanceBetweenHitboxes } from "../zombie-ai";

// Level 1 fires at smallGun's own stats; each upgrade adds +1 shot/sec and +1 damage.
const towerFireRatePerSecond = (level: number): number =>
  WEAPON_CATALOG.smallGun.fireRatePerSecond + (level - 1);
const towerDamage = (level: number): number => WEAPON_CATALOG.smallGun.damage + (level - 1);

interface TowerEntity {
  id: number;
  Tower: Tower;
  Position2D: Position2D;
  Hitbox: Hitbox;
  Health: Health;
}

// Autonomous turret: every alive tower fires at the nearest alive zombie within TOWER_RANGE on
// its own level-derived cooldown, reusing weapon.system.ts's firePellets pipeline so a tower's
// shots behave identically to a player's smallGun shots.
export const towerSystem = (registry: Registry, ctx: Context) => {
  const towers: TowerEntity[] = registry.getIndexedZipper([
    Building,
    Tower,
    Position2D,
    Hitbox,
    Health,
  ]);
  if (towers.length === 0) return;

  const zombies: { Position2D: Position2D; Hitbox: Hitbox; Health: Health; Zombie: Zombie }[] =
    registry.getZipper([Zombie, Position2D, Hitbox, Health]);
  const delta = ctx.app.delta / 1000;

  for (const tower of towers) {
    if (tower.Health.current <= 0) continue;
    if (tower.Tower.cooldownRemaining > 0) tower.Tower.cooldownRemaining -= delta;
    if (tower.Tower.cooldownRemaining > 0) continue;

    let nearestZombie: (typeof zombies)[number] | null = null;
    let nearestDistance = TOWER_RANGE;
    for (const zombie of zombies) {
      if (zombie.Health.current <= 0 || zombie.Zombie.dying) continue;
      const distance = distanceBetweenHitboxes(
        tower.Position2D,
        tower.Hitbox,
        zombie.Position2D,
        zombie.Hitbox,
      );
      if (distance <= nearestDistance) {
        nearestZombie = zombie;
        nearestDistance = distance;
      }
    }
    if (!nearestZombie) continue;

    const centerX = tower.Position2D.x + tower.Hitbox.offsetX + tower.Hitbox.width / 2;
    const centerY = tower.Position2D.y + tower.Hitbox.offsetY + tower.Hitbox.height / 2;
    const targetCenterX =
      nearestZombie.Position2D.x + nearestZombie.Hitbox.offsetX + nearestZombie.Hitbox.width / 2;
    const targetCenterY =
      nearestZombie.Position2D.y + nearestZombie.Hitbox.offsetY + nearestZombie.Hitbox.height / 2;
    const dx = targetCenterX - centerX;
    const dy = targetCenterY - centerY;
    const length = Math.hypot(dx, dy) || 1;

    firePellets(
      ctx,
      centerX,
      centerY,
      { x: dx / length, y: dy / length },
      {
        pellets: WEAPON_CATALOG.smallGun.pellets,
        spreadDegrees: WEAPON_CATALOG.smallGun.spreadDegrees,
        bulletSpeed: WEAPON_CATALOG.smallGun.bulletSpeed,
        damage: towerDamage(tower.Tower.level),
      },
    );
    tower.Tower.cooldownRemaining = 1 / towerFireRatePerSecond(tower.Tower.level);
  }
};
