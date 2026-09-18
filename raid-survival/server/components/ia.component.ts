import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

// Invoked every tick by ai.system.ts for the owning entity; reads/writes that entity's own
// components directly.
export type AIBehavior = (registry: Registry, ctx: Context, entityId: number) => void;

export class IAComponent {
  name = this.constructor.name;

  constructor(public behavior: AIBehavior) {}
}

// * Required to generate code
export default IAComponent.name;
