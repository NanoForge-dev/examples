import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

// Called every tick by aiSystem for the entity that owns this component. Decides what the NPC
// should do this frame (movement, state changes, attacks, ...) by reading/writing the entity's
// own other components directly - it's handed nothing but what it needs to look itself up.
export type AIBehavior = (registry: Registry, ctx: Context, entityId: number) => void;

export class IAComponent {
  name = this.constructor.name;

  constructor(public behavior: AIBehavior) {}
}

// * Required to generate code
export default IAComponent.name;
