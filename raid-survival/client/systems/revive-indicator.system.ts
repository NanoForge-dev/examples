import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { TransformComponent } from "../components/essentials/transform.component";
import { ReviveIndicatorComponent } from "../components/revive-indicator.component";

// Positions each revive-ring pair from its own (already parent-relative - see
// transform-children-to-parent.system.ts, which this must run after) TransformComponent, and
// fills the green Arc in from the grey Ring underneath as `elapsed` counts up toward
// `durationSeconds`. Arc/Ring aren't Sprites, so spriteSystem's own position-sync never touches
// them - this is that same job, just for these two shapes.
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

    // Neither shape carries a SpriteComponent, so zOrderSystem never manages them - the moment
    // any z-indexed sprite set changes (a zombie spawning/dying, a bullet firing - constant during
    // play, and near-guaranteed right around a downed body with zombies nearby), every actual
    // sprite gets swept above these two, permanently, even though `active`/position/animation stay
    // fully correct underneath. Same fix build-mode.system.ts already applies to gridShape/
    // previewRect/towerRangeCircles for the exact same reason - re-assert on top every tick this
    // is meant to be visible.
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
