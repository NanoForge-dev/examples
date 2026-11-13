import type { Registry } from "@nanoforge-dev/ecs/server";

import { MoveInput } from "../components/move-input.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { Health } from "../components/health.component";
import { PlayerClass } from "../components/player-class.component";
import { PLAYER_CLASS_CATALOG } from "@raid-survival/shared/player-class-catalog";

const PLAYER_SPEED = 100;

/**
 * Recomputes every player's Velocity2D from held-key intent every tick, not just when an input
 * packet arrives - otherwise collision-resolve.ts zeroing an axis on a wall hit would stick even
 * after the player is no longer blocked.
 *
 * @system
 * @side server
 */
export const moveInputSystem = (registry: Registry) => {
  const entities: {
    MoveInput: MoveInput;
    Velocity2D: Velocity2D;
    Health: Health;
    PlayerClass: PlayerClass;
  }[] = registry.getZipper([MoveInput, Velocity2D, Health, PlayerClass]);

  for (const {
    MoveInput: input,
    Velocity2D: velocity,
    Health: health,
    PlayerClass: playerClass,
  } of entities) {
    if (health.current <= 0) {
      // Dead - a corpse doesn't move regardless of what's still held.
      velocity.x = 0;
      velocity.y = 0;
      continue;
    }

    let dx = 0;
    let dy = 0;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    const speed = PLAYER_SPEED * PLAYER_CLASS_CATALOG[playerClass.playerClass].speedMultiplier;
    const length = Math.hypot(dx, dy) || 1;
    velocity.x = (dx / length) * speed;
    velocity.y = (dy / length) * speed;
  }
};
