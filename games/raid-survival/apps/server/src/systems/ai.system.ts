import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";

import { IAComponent } from "../components/ia.component";

/**
 * Generic dispatcher: calls each entity's own behavior lambda (see zombie-ai.ts).
 *
 * @system
 * @side server
 */
export const aiSystem = (registry: Registry, ctx: Context) => {
  const entities: { id: number; IAComponent: IAComponent }[] = registry.getIndexedZipper([IAComponent]);

  for (const entity of entities) {
    entity.IAComponent.behavior(registry, ctx, entity.id);
  }
};
