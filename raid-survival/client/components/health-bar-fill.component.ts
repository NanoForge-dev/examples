export class HealthBarFill {
  name = this.constructor.name;

  // Fill's cavity-left-edge X in parent-local space - constant per instance, used to recompute
  // LocalTransform.x on a health change.
  constructor(public cavityLocalX: number) {}
}

// * Required to generate code
export default HealthBarFill.name;
