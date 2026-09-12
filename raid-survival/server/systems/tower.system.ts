import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { Building } from "../components/building.component";
import { Tower } from "../components/tower.component";
import { Position } from "../components/position.component";
import { Hitbox } from "../components/hitbox.component";
import { Health } from "../components/health.component";
import { Zombie } from "../components/zombie.component";
import { WEAPON_CATALOG } from "../weapon-catalog";
import { firePellets } from "./weapon.system";
import { distanceBetweenHitboxes } from "./zombie-ai";

// How far a tower can see/shoot a zombie - generous on purpose (stationary defense, no aim-assist
// needed the way a player's mouse gives them one). Invented for this feature, easy to retune.
export const TOWER_RANGE = 120;
export const TOWER_MAX_LEVEL = 6;
export const TOWER_HP_PER_LEVEL = 50;
export const TOWER_UPGRADE_COST = 50;
// Flat repair-to-full cost, same as one upgrade - a per-missing-HP rate would make repairing a
// heavily-damaged level-6 tower (up to 350 HP) cost far more than upgrading it ever did. Invented
// for this feature, easy to retune.
export const TOWER_HEAL_COST = 50;

// level 1 fires at exactly smallGun's own stats ("shoot continuously using the small gun" - the
// user's spec); each upgrade adds +1 shot/sec and +1 damage on top of that baseline. Both curves
// are invented (the request only said "faster and harder"), easy to retune - level 6 ends up at
// 10 shots/sec for 7 damage vs. level 1's 5/sec for 2.
export function towerFireRatePerSecond(level: number): number {
  return WEAPON_CATALOG.smallGun.fireRatePerSecond + (level - 1);
}
export function towerDamage(level: number): number {
  return WEAPON_CATALOG.smallGun.damage + (level - 1);
}

interface TowerEntity {
  id: number;
  Tower: Tower;
  Position: Position;
  Hitbox: Hitbox;
  Health: Health;
}

// Autonomous turret: every alive tower fires at the nearest alive zombie within TOWER_RANGE,
// on its own level-derived cooldown - no player input involved (that's tower-interact.system.ts,
// the E-press heal/upgrade). Reuses weapon.system.ts's exact bullet-spawn pipeline
// (firePellets/Bullet/bullet.system.ts) so a tower's shots behave identically to a player's
// smallGun shots in every way that matters (collision, damage application, client rendering).
export function towerSystem(registry: Registry, ctx: Context) {
  const towers: TowerEntity[] = registry.getIndexedZipper([
    Building,
    Tower,
    Position,
    Hitbox,
    Health,
  ]);
  if (towers.length === 0) return;

  const zombies: { Position: Position; Hitbox: Hitbox; Health: Health; Zombie: Zombie }[] =
    registry.getZipper([Zombie, Position, Hitbox, Health]);

  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
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
        tower.Position,
        tower.Hitbox,
        zombie.Position,
        zombie.Hitbox,
      );
      if (distance <= nearestDistance) {
        nearestZombie = zombie;
        nearestDistance = distance;
      }
    }
    if (!nearestZombie) continue;

    const centerX = tower.Position.x + tower.Hitbox.offsetX + tower.Hitbox.width / 2;
    const centerY = tower.Position.y + tower.Hitbox.offsetY + tower.Hitbox.height / 2;
    const targetCenterX =
      nearestZombie.Position.x + nearestZombie.Hitbox.offsetX + nearestZombie.Hitbox.width / 2;
    const targetCenterY =
      nearestZombie.Position.y + nearestZombie.Hitbox.offsetY + nearestZombie.Hitbox.height / 2;
    const dx = targetCenterX - centerX;
    const dy = targetCenterY - centerY;
    const length = Math.hypot(dx, dy) || 1;

    firePellets(
      registry,
      network,
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
}

// * Required to generate code
export default towerSystem.name;
