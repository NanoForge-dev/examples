import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { Health } from "../../components/health.component";
import { ChildrenComponent } from "../../components/children.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { HealthBarFill } from "../../components/health-bar-fill.component";

// Must match the health bar geometry it was built with
// (client/systems/packet-handlers/start-game-packet.handler.ts).
const HEALTH_BAR_FILL_WIDTH = 12;
const HEALTH_BAR_FILL_CAVITY_WIDTH = 19;
const HEALTH_BAR_FILL_MAX_SCALE_X = HEALTH_BAR_FILL_CAVITY_WIDTH / HEALTH_BAR_FILL_WIDTH;

export function hitPacketHandler(packet: any, registry: Registry): void {
  const targets: { id: number; NetworkId: NetworkId; Health: Health }[] = registry.getIndexedZipper([
    NetworkId,
    Health,
  ]);
  const target = targets.find((entity) => entity.NetworkId.id === packet.id);
  if (!target) return;

  target.Health.current = Math.max(0, Math.min(target.Health.max, target.Health.current - packet.damage));
  const fraction = target.Health.max > 0 ? target.Health.current / target.Health.max : 0;

  const fills: {
    ChildrenComponent: ChildrenComponent;
    SpriteComponent: SpriteComponent;
    HealthBarFill: HealthBarFill;
  }[] = registry.getZipper([ChildrenComponent, SpriteComponent, HealthBarFill]);
  const fill = fills.find((entity) => entity.ChildrenComponent.parentId === target.id);
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
