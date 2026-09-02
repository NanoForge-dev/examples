export type ZombieAnimationState = "idle" | "attack";

export class Zombie {
  name = this.constructor.name;

  // Coins awarded to the shared money pool when this zombie dies (zombie-death.system.ts) -
  // varies by zombie type; the only type today is the punching zombie, worth
  // ZOMBIE_COIN_VALUE (see start-game-packet.handler.ts).
  constructor(public coinValue: number) {}

  // null until the AI resolves an initial state on its first tick - guarantees that first
  // resolution is always treated as a transition, so clients get told about it.
  animationState: ZombieAnimationState | null = null;
  // Seconds into the current attack animation loop (mirrors the client's frameRate: 7 sprite
  // animation - see zombie-ai.ts).
  attackElapsed: number = 0;
  hasDealtDamageThisCycle: boolean = false;

  // Entity id of whoever this zombie attacked most recently. Re-evaluated every tick - this is
  // only a tie-break preference (keep attacking the same thing when several targets are in range
  // at once), never a hard lock: it's freely overridden whenever a different target becomes the
  // best pick.
  lastAttackedTargetId: number | null = null;

  // Entity id of whoever this zombie is currently steering toward while not attacking. Used only
  // to detect a mid-chase target switch so a correction packet can be sent - without it, the
  // client keeps extrapolating the old direction until the next unrelated broadcast, which looks
  // like a teleport.
  lastMoveTargetId: number | null = null;

  // Set the instant Health.current hits 0 (zombie-death.system.ts) - lets the death animation
  // play out for a moment before the entity is actually removed, instead of vanishing instantly.
  // While dying: zombie-ai.ts treats it as inert (no movement/attack), bullet.system.ts won't hit
  // it a second time.
  dying: boolean = false;
  dyingRemaining: number = 0;
}

// * Required to generate code
export default Zombie.name;
