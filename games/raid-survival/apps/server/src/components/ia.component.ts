import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";

/** Runs every tick for the entity that owns it, reading and writing its own components. */
export type AIBehavior = (registry: Registry, ctx: Context, entityId: number) => void;

const idle: AIBehavior = () => {};

/**
 * Gives an entity a behavior, run every tick by `aiSystem` (the zombies' one is in `zombie-ai.ts`).
 *
 * @component
 * @side server
 */
export class IAComponent {
  name = "IAComponent";

  constructor(
    /** What the entity does each tick. */
    public behavior: AIBehavior = idle,
  ) {}
}
