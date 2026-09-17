import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { Health } from "../../components/health.component";
import { ChildrenComponent } from "../../components/children.component";
import { ReviveIndicatorComponent } from "../../components/revive-indicator.component";

// Server (revive.system.ts) is authoritative - this just applies its events: show/hide the
// target's revive ring, and on "completed" set Health directly (which also flips
// player-death.system.ts back to "idle").
export function revivePacketHandler(packet: any, registry: Registry): void {
  const targets: { id: number; NetworkId: NetworkId; Health: Health }[] = registry.getIndexedZipper(
    [NetworkId, Health],
  );
  const target = targets.find((entity) => entity.NetworkId.id === packet.targetId);
  if (!target) return;

  const indicators: {
    ChildrenComponent: ChildrenComponent;
    ReviveIndicatorComponent: ReviveIndicatorComponent;
  }[] = registry.getZipper([ChildrenComponent, ReviveIndicatorComponent]);
  const indicator = indicators.find(
    (entity) => entity.ChildrenComponent.parentId === target.id,
  )?.ReviveIndicatorComponent;

  switch (packet.state) {
    case "started":
      if (indicator) {
        indicator.active = true;
        indicator.elapsed = 0;
        indicator.durationSeconds = packet.durationSeconds;
        indicator.fill.angle(0);
        indicator.background.visible(true);
        indicator.fill.visible(true);
      }
      break;
    case "cancelled":
      if (indicator) {
        indicator.active = false;
        indicator.background.visible(false);
        indicator.fill.visible(false);
      }
      break;
    case "completed":
      target.Health.current = Math.max(0, Math.min(target.Health.max, packet.health));
      if (indicator) {
        indicator.active = false;
        indicator.background.visible(false);
        indicator.fill.visible(false);
      }
      break;
  }
}
