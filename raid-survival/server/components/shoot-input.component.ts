// Held-input state; weapon.system.ts recomputes firing/reloading from this every tick, not from
// packet frequency.
export class ShootInput {
  name = this.constructor.name;

  shooting: boolean = false; // left-click - the single equipped weapon
  // One-shot; consumed by weapon.system.ts next tick regardless of whether a reload started.
  reloadRequested: boolean = false;
  // World-space mouse position; weapon.system.ts computes aim fresh from this at fire time rather
  // than the (visual-only) Direction component. Null until the first input packet arrives.
  mousePosition: { x: number; y: number } | null = null;
}

// * Required to generate code
export default ShootInput.name;
