/**
 * The fill of a health bar, scaled to the health of the entity it follows (`updateHealthBar`).
 *
 * @component
 * @side client
 */
export class HealthBarFill {
  name = "HealthBarFill";

  // Fill's cavity-left-edge X in parent-local space - constant per instance, used to recompute
  // LocalTransform.x on a health change.
  constructor(public cavityLocalX: number) {}
}
