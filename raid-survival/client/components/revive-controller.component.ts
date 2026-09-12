import { InputEnum } from "@nanoforge-dev/input";

// Local-player-only controller (see buildPlayer in start-game-packet.handler.ts, same gating as
// MoveController/ShootController) for the hold-E revive channel. Unlike ShootController's reload
// key, this is a plain level-triggered hold, not an edge-detected one-shot press - holding is the
// entire mechanic. All range/timing is server-authoritative (see revive.system.ts); this only
// reports "is the local player holding E right now".
export class ReviveController {
  name = this.constructor.name;

  keyRevive: InputEnum = InputEnum.KeyE;
  held: boolean = false;
  // Last value actually sent to the server - same on-change dedup ShootController's
  // lastSentMainWeaponShooting/lastSentSecondWeaponShooting use.
  lastSentHeld: boolean = false;

  // `held` above is level-triggered (matches revive's hold-to-channel design); this is the
  // edge-detected companion for the SAME key's other action - an instant heal/upgrade on a
  // nearby tower (tower-interact.system.ts, server). `wasHeld` is last tick's `held`, used to
  // detect the rising edge; `interactRequested` is the one-shot request itself, cleared once
  // sent - same "one-shot until consumed" shape as ShootController.reloadRequested.
  wasHeld: boolean = false;
  interactRequested: boolean = false;
}

// * Required to generate code
export default ReviveController.name;
