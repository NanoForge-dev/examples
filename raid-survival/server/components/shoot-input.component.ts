// Raw held-input state from the client, persisted separately from any fire-rate/reload timing -
// same reasoning as MoveInput: weapon.system.ts recomputes firing/reloading from this every
// tick, not from packet frequency, so it isn't tied to how often the client happens to send one.
export class ShootInput {
  name = this.constructor.name;

  shooting: boolean = false; // left-click / main hand
  rightShooting: boolean = false; // right-click / off hand
  // One-shot: set true by a reload input packet, consumed (and reset to false) the next tick
  // weapon.system.ts runs, whether or not a reload actually started. Applies to both hands at
  // once (see weapon.system.ts).
  reloadRequested: boolean = false;
  // World-space mouse position, updated every input packet - weapon.system.ts recomputes the aim
  // vector fresh from this (player position -> mouse) at the exact moment a shot fires, instead
  // of firing with whatever the separately-networked Direction component happens to hold. Direction
  // stays purely visual (rotation broadcast). Null only before the very first input packet arrives.
  mousePosition: { x: number; y: number } | null = null;
}

// * Required to generate code
export default ShootInput.name;
