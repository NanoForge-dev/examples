/**
 * Revive channel state lives on the REVIVER, not the downed target. Interrupting (release E,
 * lose range, switch target) resets progress to 0 - see revive system.
 *
 * @component
 * @side server
 */
export class ReviveInput {
  name = "ReviveInput";

  held: boolean = false;
  // Seconds channeled toward `targetId`; reset on interrupt/switch.
  progressSeconds: number = 0;
  targetId: number | null = null;
  // One-shot E-press flag (distinct from `held`'s multi-second channel) - consumed by
  // building-interact system, which defers to an active revive channel (`targetId !== null`)
  // so one keypress never triggers both.
  interactRequested: boolean = false;
}
