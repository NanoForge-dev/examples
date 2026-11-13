export type ZombieAnimationState = "idle" | "attack";

/**
 * TODO Zombie
 *
 * @component
 * @side server
 */
export class Zombie {
  name = "Zombie";

  // Coins awarded on death (zombie-death system); currently always ZOMBIE_COIN_VALUE
  // (start-game-packet.handler.ts).
  constructor(
    /** Coins given to the team when it dies. */
    public coinValue = 10,
  ) {}

  // Null until the AI's first tick, so that first resolution always broadcasts as a transition.
  animationState: ZombieAnimationState | null = null;
  // Seconds into the current attack animation loop (mirrors client's 7fps sprite animation).
  attackElapsed: number = 0;
  hasDealtDamageThisCycle: boolean = false;

  // Last attack target - a tie-break preference only, freely overridden when a better target
  // appears.
  lastAttackedTargetId: number | null = null;

  // Current chase target - used only to detect a target switch and send a correction packet
  // (otherwise the client dead-reckons the old direction, which looks like a teleport).
  lastMoveTargetId: number | null = null;

  // Set when Health hits 0, so the death animation plays before removal. While true, zombie-ai.ts
  // treats the zombie as inert and bullet system won't re-hit it.
  dying: boolean = false;
  dyingRemaining: number = 0;
}
