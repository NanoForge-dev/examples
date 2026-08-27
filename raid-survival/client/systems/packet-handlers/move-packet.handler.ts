import { Registry } from "@nanoforge-dev/ecs-client";
import { Position } from "../../components/position.component";
import { Velocity } from "../../components/velocity.component";
import { NetworkId } from "../../components/network-id.component";

export function movePacketHandler(packet: any, registry: Registry): void {
  const zipper = registry.getZipper([NetworkId, Position, Velocity]);
  const it = zipper.find((entity) => {
    return entity.NetworkId.id === packet.id;
  });
  if (!it) return;

  it.Position.x = packet.position.x;
  it.Position.y = packet.position.y;
  it.Velocity.x = packet.velocity.x;
  it.Velocity.y = packet.velocity.y;
}
