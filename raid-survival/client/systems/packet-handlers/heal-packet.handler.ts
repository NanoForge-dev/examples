import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { Health } from "../../components/health.component";
import { updateHealthBarFill } from "../health-bar-update";

// loot-box-pickup.system.ts's heal-box result (server-authoritative final value, same "send the
// number, don't make the client recompute a delta" idiom revive's "completed" event uses).
export function healPacketHandler(packet: any, registry: Registry): void {
  const targets: { id: number; NetworkId: NetworkId; Health: Health }[] = registry.getIndexedZipper(
    [NetworkId, Health],
  );
  const target = targets.find((entity) => entity.NetworkId.id === packet.id);
  if (!target) return;

  target.Health.current = packet.health.current;
  target.Health.max = packet.health.max;
  const fraction = target.Health.max > 0 ? target.Health.current / target.Health.max : 0;
  updateHealthBarFill(registry, target.id, fraction);
}
