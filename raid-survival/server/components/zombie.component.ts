export type ZombieAnimationState = "idle" | "attack";

export class Zombie {
  name = this.constructor.name;

  // Coins awarded on death (zombie-death.system.ts); currently always ZOMBIE_COIN_VALUE
  // (start-game-packet.handler.ts).
  constructor(public coinValue: number) {}

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
  // treats the zombie as inert and bullet.system.ts won't re-hit it.
  dying: boolean = false;
  dyingRemaining: number = 0;
}

// * Required to generate code
export default Zombie.name;
