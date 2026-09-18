import { Registry } from "@nanoforge-dev/ecs-client";
import { ChildrenComponent } from "../components/children.component";
import { SpriteComponent } from "../components/renderable/sprite.component";
import { HealthBarFill } from "../components/health-bar-fill.component";

// Must match the health bar geometry it was built with (start-game-packet.handler.ts).
const HEALTH_BAR_FILL_WIDTH = 12;
const HEALTH_BAR_FILL_CAVITY_WIDTH = 19;
const HEALTH_BAR_FILL_MAX_SCALE_X = HEALTH_BAR_FILL_CAVITY_WIDTH / HEALTH_BAR_FILL_WIDTH;

// Shared by every packet that changes a target's Health, so they all redraw the bar the same way.
export function updateHealthBarFill(registry: Registry, targetId: number, fraction: number): void {
  const fills: {
    ChildrenComponent: ChildrenComponent;
    SpriteComponent: SpriteComponent;
    HealthBarFill: HealthBarFill;
  }[] = registry.getZipper([ChildrenComponent, SpriteComponent, HealthBarFill]);
  const fill = fills.find((entity) => entity.ChildrenComponent.parentId === targetId);
  if (!fill) return;

  const fillScaleX = HEALTH_BAR_FILL_MAX_SCALE_X * fraction;
  // SpriteComponent scales around its own center, so LocalTransform must shift back to keep the
  // fill's left edge pinned to the cavity's left edge instead of shrinking symmetrically.
  fill.ChildrenComponent.options.LocalTransform = {
    x: fill.HealthBarFill.cavityLocalX - (HEALTH_BAR_FILL_WIDTH / 2) * (1 - fillScaleX),
    y: fill.ChildrenComponent.options.LocalTransform?.y ?? 0,
  };
  fill.SpriteComponent.setScale({ x: fillScaleX, y: 1 });
}
