/**
 * Held-input state; weapon system recomputes firing/reloading from this every tick, not from
 * packet frequency.
 *
 * @component
 * @side server
 */
export class ShootInput {
  name = "ShootInput";

  shooting: boolean = false; // left-click - the single equipped weapon
  // One-shot; consumed by weapon system next tick regardless of whether a reload started.
  reloadRequested: boolean = false;
  // World-space mouse position; weapon system computes aim fresh from this at fire time rather
  // than the (visual-only) Direction component. Null until the first input packet arrives.
  mousePosition: { x: number; y: number } | null = null;
}
