// Revive channel state lives on the REVIVER, not the downed target. Interrupting (release E,
// lose range, switch target) resets progress to 0 - see revive.system.ts.
export class ReviveInput {
  name = this.constructor.name;

  held: boolean = false;
  // Seconds channeled toward `targetId`; reset on interrupt/switch.
  progressSeconds: number = 0;
  targetId: number | null = null;
  // One-shot E-press flag (distinct from `held`'s multi-second channel) - consumed by
  // building-interact.system.ts, which defers to an active revive channel (`targetId !== null`)
  // so one keypress never triggers both.
  interactRequested: boolean = false;
}

// * Required to generate code
export default ReviveInput.name;
