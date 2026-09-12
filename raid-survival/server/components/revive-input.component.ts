// Raw held-input state from the client (mirrors shoot-input.component.ts's `shooting`), plus the
// revive channel's own progress - kept on the REVIVER, not the downed target, so only whoever's
// actually channeling counts, and releasing E / losing range / switching targets naturally resets
// it via revive.system.ts (per design: an interrupted revive starts over, it doesn't pause/resume).
export class ReviveInput {
  name = this.constructor.name;

  held: boolean = false;
  // Seconds channeled toward `targetId` so far - reset to 0 whenever the channel is interrupted
  // or switches target (see revive.system.ts).
  progressSeconds: number = 0;
  // Entity id of the downed player currently being revived by this player, or null while not
  // channeling.
  targetId: number | null = null;
  // One-shot: set true by a fresh (edge-detected client-side) "E" press, consumed and cleared the
  // next tick tower-interact.system.ts runs, whether or not anything was actually in range to
  // interact with. Same E key as `held` above, but a different action (an instant heal/upgrade,
  // not a multi-second channel) - tower-interact.system.ts defers to an in-progress revive
  // (`targetId !== null`) so one keypress never does both.
  interactRequested: boolean = false;
}

// * Required to generate code
export default ReviveInput.name;
