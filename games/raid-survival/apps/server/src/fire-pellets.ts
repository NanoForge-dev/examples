import type { Context } from "@nanoforge-dev/common";

import { broadcast } from "./broadcast";
import { Bullet } from "./components/bullet.component";
import { Position2D } from "./components/position-2d.component";
import { Velocity2D } from "./components/velocity-2d.component";

// Just the fields firePellets actually reads, so the tower system can hand it a computed
// per-level stat block without needing a real catalog entry of its own.
export interface PelletStats {
  pellets: number;
  spreadDegrees: number;
  bulletSpeed: number;
  damage: number;
}

/**
 * Fires a weapon's bullets from a point. `direction` is a fresh, already-normalized aim vector computed at the moment of firing (see
 * computeAimDirection) - not the persisted Direction component, which is purely visual. Shared
 * with the tower system can fire the same bullet pipeline autonomously.
 */
export const firePellets = (
  ctx: Context,
  centerX: number,
  centerY: number,
  direction: { x: number; y: number },
  catalog: PelletStats,
) => {
  const registry = ctx.ecs.registry;
  const pellets = catalog.pellets;
  const spreadRad = (catalog.spreadDegrees * Math.PI) / 180;

  for (let i = 0; i < pellets; i++) {
    // Spans [-0.5, 0.5] across the pellets, 0 for a single pellet - i.e. dead center, matching
    // today's single-bullet aim exactly.
    const t = pellets === 1 ? 0 : i / (pellets - 1) - 0.5;
    const angle = t * spreadRad;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const vx = (direction.x * cos - direction.y * sin) * catalog.bulletSpeed;
    const vy = (direction.x * sin + direction.y * cos) * catalog.bulletSpeed;

    const bullet = registry.spawnEntity();
    registry.addComponent(bullet, new Position2D(centerX, centerY));
    registry.addComponent(bullet, new Velocity2D(vx, vy));
    registry.addComponent(bullet, new Bullet(catalog.damage));

    broadcast(ctx, {
      type: "spawn",
      entityType: "bullet",
      id: bullet.getId(),
      position: { x: centerX, y: centerY },
      velocity: { x: vx, y: vy },
    });
  }
};
