import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { Health } from "../../components/health.component";
import { updateHealthBarFill } from "../health-bar-update";

export function hitPacketHandler(packet: any, registry: Registry): void {
  const targets: { id: number; NetworkId: NetworkId; Health: Health }[] = registry.getIndexedZipper(
    [NetworkId, Health],
  );
  const target = targets.find((entity) => entity.NetworkId.id === packet.id);
  if (!target) return;

  target.Health.current = Math.max(
    0,
    Math.min(target.Health.max, target.Health.current - packet.damage),
  );
  const fraction = target.Health.max > 0 ? target.Health.current / target.Health.max : 0;
  updateHealthBarFill(registry, target.id, fraction);
}
