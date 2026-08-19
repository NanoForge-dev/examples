import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";

export function killPacketHandler(packet: any, registry: Registry): void {
  const zipper = registry.getIndexedZipper([NetworkId]);
  const it = zipper.find((entity) => {
    return entity.NetworkId.id === packet.id;
  });
  if (!it) return;
  registry.killEntity(it.id)
}
