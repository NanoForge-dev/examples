// Raw held-input state from the client, persisted separately from any fire-rate/reload timing -
// same reasoning as MoveInput: weapon.system.ts recomputes firing/reloading from this every
// tick, not from packet frequency, so it isn't tied to how often the client happens to send one.
export class ShootInput {
  name = this.constructor.name;

  shooting: boolean = false;
  // One-shot: set true by a reload input packet, consumed (and reset to false) the next tick
  // weapon.system.ts runs, whether or not a reload actually started.
  reloadRequested: boolean = false;
}

// * Required to generate code
export default ShootInput.name;
