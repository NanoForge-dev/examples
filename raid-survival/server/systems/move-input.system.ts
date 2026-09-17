import { type Registry } from "@nanoforge-dev/ecs-client";

import { MoveInput } from "../components/move-input.component";
import { Velocity } from "../components/velocity.component";
import { Health } from "../components/health.component";
import { PlayerClass } from "../components/player-class.component";
import { PLAYER_CLASS_CATALOG } from "../player-class-catalog";
import { PLAYER_SPEED } from "../main";

// Recomputes every player's Velocity from held-key intent every tick, not just when an input
// packet arrives - otherwise collision-resolve.ts zeroing an axis on a wall hit would stick even
// after the player is no longer blocked.
export function moveInputSystem(registry: Registry) {
  const entities: {
    MoveInput: MoveInput;
    Velocity: Velocity;
    Health: Health;
    PlayerClass: PlayerClass;
  }[] = registry.getZipper([MoveInput, Velocity, Health, PlayerClass]);

  for (const {
    MoveInput: input,
    Velocity: velocity,
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
}

// * Required to generate code
export default moveInputSystem.name;
