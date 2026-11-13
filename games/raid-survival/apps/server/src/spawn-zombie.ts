import type { Context } from "@nanoforge-dev/common";
import { TILE_SIZE, TREE_LOCATIONS } from "@raid-survival/shared/map";
import type { Vector } from "@raid-survival/shared/protocol";

import { broadcast } from "./broadcast";
import { Direction } from "./components/direction.component";
import { Health } from "./components/health.component";
import { Hitbox } from "./components/hitbox.component";
import { IAComponent } from "./components/ia.component";
import { Position2D } from "./components/position-2d.component";
import { Velocity2D } from "./components/velocity-2d.component";
import { Zombie } from "./components/zombie.component";
import { ZOMBIE_MAX_HEALTH, createZombieBehavior } from "./zombie-ai";

// Combat footprint used for zombie-vs-target range checks (zombie-ai).
const ZOMBIE_HITBOX: Vector = { x: 24, y: 24 };

const ZOMBIE_COIN_VALUE = 10;

// Spawns a single zombie from a random tree cell, hunting via its own IAComponent. How many to
// spawn and when is the zombie wave system's concern - this just spawns one.
export const spawnZombie = (ctx: Context, lobbyEntityId: number): void => {
  const registry = ctx.ecs.registry;
  const cell = TREE_LOCATIONS[Math.floor(Math.random() * TREE_LOCATIONS.length)];
  if (!cell) return;

  const position: Vector = {
    x: cell.x * TILE_SIZE + TILE_SIZE / 2,
    y: cell.y * TILE_SIZE + TILE_SIZE / 2,
  };

  const zombie = registry.spawnEntity();
  registry.addComponent(zombie, new Position2D(position.x, position.y));
  registry.addComponent(zombie, new Velocity2D(0, 0));
  registry.addComponent(zombie, new Direction(1, 0));
  registry.addComponent(zombie, new Health(ZOMBIE_MAX_HEALTH, ZOMBIE_MAX_HEALTH));
  registry.addComponent(zombie, new Hitbox(ZOMBIE_HITBOX.x, ZOMBIE_HITBOX.y));
  registry.addComponent(zombie, new Zombie(ZOMBIE_COIN_VALUE));
  registry.addComponent(zombie, new IAComponent(createZombieBehavior(lobbyEntityId)));

  broadcast(ctx, {
    type: "spawn",
    entityType: "zombie",
    id: zombie.getId(),
    position,
    velocity: { x: 0, y: 0 },
    direction: { x: 1, y: 0 },
    health: { current: ZOMBIE_MAX_HEALTH, max: ZOMBIE_MAX_HEALTH },
  });
};
