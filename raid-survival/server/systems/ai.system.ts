import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { IAComponent } from "../components/ia.component";

// Generic: has no idea what a zombie is. Any entity with an IAComponent gets its behavior
// lambda called once per tick - whatever that entity should do lives entirely in the lambda
// itself (see zombie-ai.ts for the zombie one).
export function aiSystem(registry: Registry, ctx: Context) {
  const entities: { id: number; IAComponent: IAComponent }[] = registry.getIndexedZipper([IAComponent]);

  for (const entity of entities) {
    entity.IAComponent.behavior(registry, ctx, entity.id);
  }
}

// * Required to generate code
export default aiSystem.name;
