import { type Registry } from "@nanoforge-dev/ecs-client";

import { MoveInput } from "../components/move-input.component";
import { Velocity } from "../components/velocity.component";
import { Health } from "../components/health.component";
import { PLAYER_SPEED } from "../main";

// Recomputes every player's Velocity fresh from their held-key intent every tick, before
// movement and collision run. Without this, collision-resolve.ts's wall-slide handling (which
// zeros whichever axis caused an overlap, directly on Velocity) would stick: the client only
// re-sends an "input" packet when the *set* of held keys changes
// (move-control.senders.system.ts), not every frame, so a zeroed axis would otherwise never get
// restored while the player keeps holding the same keys - even once nothing is blocking it any
// more. Recomputing here every tick means a collision's zeroing only ever lasts the tick(s) it's
// actually still blocked.
export function moveInputSystem(registry: Registry) {
  const entities: { MoveInput: MoveInput; Velocity: Velocity; Health: Health }[] = registry.getZipper([
    MoveInput,
    Velocity,
    Health,
  ]);

  for (const { MoveInput: input, Velocity: velocity, Health: health } of entities) {
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

    const length = Math.hypot(dx, dy) || 1;
    velocity.x = (dx / length) * PLAYER_SPEED;
    velocity.y = (dy / length) * PLAYER_SPEED;
  }
}

// * Required to generate code
export default moveInputSystem.name;
