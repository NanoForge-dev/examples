export class HealthBarFill {
  name = this.constructor.name;

  // The fill's cavity-left-edge X, in its parent's local coordinate space (frameLocalX + the
  // cavity's own inset). Constant per health bar instance regardless of current health -
  // needed to recompute LocalPosition.x on a hit without also needing to know the parent's
  // sprite width (player vs lobby) again.
  constructor(public cavityLocalX: number) {}
}

// * Required to generate code
export default HealthBarFill.name;
