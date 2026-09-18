import { InputEnum } from "@nanoforge-dev/input";

// Local-player-only controller for the hold-E revive channel. `held` is a plain level-triggered
// hold; range/timing is server-authoritative (see revive.system.ts).
export class ReviveController {
  name = this.constructor.name;

  keyRevive: InputEnum = InputEnum.KeyE;
  held: boolean = false;
  lastSentHeld: boolean = false;

  // Edge-detected companion for the same key's other action - an instant heal/upgrade on a
  // nearby building (building-interact.system.ts, server). `wasHeld` detects the rising edge;
  // `interactRequested` is the one-shot request, cleared once sent.
  wasHeld: boolean = false;
  interactRequested: boolean = false;
}

// * Required to generate code
export default ReviveController.name;
