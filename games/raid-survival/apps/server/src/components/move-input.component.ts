/**
 * Held-key intent, kept separate from Velocity: move-input system recomputes Velocity from
 * this every tick, so a wall-collision-zeroed axis (collision-resolve.ts) isn't stuck once
 * unblocked.
 *
 * @component
 * @side server
 */
export class MoveInput {
  name = "MoveInput";

  up: boolean = false;
  down: boolean = false;
  left: boolean = false;
  right: boolean = false;

  // Last velocity broadcast (move-sync system) - used to detect a blocked axis becoming free
  // again.
  lastBroadcastVelocity: { x: number; y: number } = { x: 0, y: 0 };
}
