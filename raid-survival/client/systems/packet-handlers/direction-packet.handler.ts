import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { Direction } from "../../components/direction.component";

export function directionPacketHandler(packet: any, registry: Registry): void {
  const zipper = registry.getZipper([NetworkId, Direction]);
  const it = zipper.find((entity) => {
    return entity.NetworkId.id === packet.id;
  });
  if (!it) return;
  it.Direction.x = packet.direction.x;
  it.Direction.y = packet.direction.y;
}
