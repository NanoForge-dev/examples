import { Registry } from "@nanoforge-dev/ecs-client";
import { ChildrenComponent } from "../components/children.component";
import { SpriteComponent } from "../components/renderable/sprite.component";
import { HealthBarFill } from "../components/health-bar-fill.component";

// Must match the health bar geometry it was built with
// (client/systems/packet-handlers/start-game-packet.handler.ts).
const HEALTH_BAR_FILL_WIDTH = 12;
const HEALTH_BAR_FILL_CAVITY_WIDTH = 19;
const HEALTH_BAR_FILL_MAX_SCALE_X = HEALTH_BAR_FILL_CAVITY_WIDTH / HEALTH_BAR_FILL_WIDTH;

// Extracted from hit-packet.handler.ts so every packet that changes a target's Health (damage,
// heal, a tower's own heal/upgrade) redraws its health bar the exact same way. Fraction-based, so
// a changing Health.max (a tower leveling up) needs no special handling here - just call this
// after updating Health.current/max, same as hit-packet.handler.ts always did.
export function updateHealthBarFill(registry: Registry, targetId: number, fraction: number): void {
  const fills: {
    ChildrenComponent: ChildrenComponent;
    SpriteComponent: SpriteComponent;
    HealthBarFill: HealthBarFill;
  }[] = registry.getZipper([ChildrenComponent, SpriteComponent, HealthBarFill]);
  const fill = fills.find((entity) => entity.ChildrenComponent.parentId === targetId);
  if (!fill) return;

  const fillScaleX = HEALTH_BAR_FILL_MAX_SCALE_X * fraction;
  // Same anchor compensation used when the bar was first built: SpriteComponent scales around
  // its own center, so the LocalTransform has to shift back the other way to keep the fill's
  // left edge pinned to the cavity's left edge instead of shrinking symmetrically.
  fill.ChildrenComponent.options.LocalTransform = {
    x: fill.HealthBarFill.cavityLocalX - (HEALTH_BAR_FILL_WIDTH / 2) * (1 - fillScaleX),
    y: fill.ChildrenComponent.options.LocalTransform?.y ?? 0,
  };
  fill.SpriteComponent.setScale({ x: fillScaleX, y: 1 });
}
