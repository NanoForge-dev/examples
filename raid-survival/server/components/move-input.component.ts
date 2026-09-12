// Raw held-key intent from the client, persisted separately from Velocity - see
// move-input.system.ts for why: Velocity gets recomputed from this every tick, so a wall
// collision zeroing one axis (collision-resolve.ts) never permanently overrides what the player
// is actually still holding, only what's applied for the tick(s) it's genuinely blocked.
export class MoveInput {
  name = this.constructor.name;

  up: boolean = false;
  down: boolean = false;
  left: boolean = false;
  right: boolean = false;

  // Last velocity actually broadcast to clients (move-sync.system.ts) - compared every tick,
  // after movement and collision have both fully resolved, to catch a blocked axis becoming
  // unblocked again, which nothing else announces.
  lastBroadcastVelocity: { x: number; y: number } = { x: 0, y: 0 };
}

// * Required to generate code
export default MoveInput.name;
