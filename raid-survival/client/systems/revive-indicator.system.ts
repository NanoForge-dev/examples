import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { TransformComponent } from "../components/essentials/transform.component";
import { ReviveIndicatorComponent } from "../components/revive-indicator.component";

// Positions each revive ring pair and fills the green Arc in from the grey Ring underneath as
// `elapsed` counts toward `durationSeconds`. Arc/Ring aren't Sprites, so spriteSystem never
// positions them - this does that job for these two shapes. Must run after
// transform-children-to-parent.system.ts.
export function reviveIndicatorSystem(registry: Registry, ctx: Context) {
  const entities: {
    TransformComponent: TransformComponent;
    ReviveIndicatorComponent: ReviveIndicatorComponent;
  }[] = registry.getZipper([TransformComponent, ReviveIndicatorComponent]);
  if (entities.length === 0) return;

  const delta = ctx.app.delta / 1000;

  for (const { TransformComponent: transform, ReviveIndicatorComponent: indicator } of entities) {
    indicator.background.position({ x: transform.x, y: transform.y });
    indicator.fill.position({ x: transform.x, y: transform.y });

    if (!indicator.active) continue;

    // Neither shape carries a SpriteComponent, so zOrderSystem never manages them and they'd get
    // permanently buried under z-indexed sprites without this re-assertion every tick.
    indicator.background.moveToTop();
    indicator.fill.moveToTop();

    indicator.elapsed += delta;
    const fraction =
      indicator.durationSeconds > 0
        ? Math.min(indicator.elapsed / indicator.durationSeconds, 1)
        : 1;
    indicator.fill.angle(360 * fraction);
  }
}

// * Required to generate code
export default reviveIndicatorSystem.name;
