import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { Position } from "../../components/position.component";
import { Velocity } from "../../components/velocity.component";

export function movePacketHandler(packet: any, registry: Registry): void {
  const zipper = registry.getZipper([NetworkId, Position, Velocity]);
  console.log(packet, zipper);
  const it = zipper.find((entity) => {
    console.log(entity.NetworkId.id, packet.id);
    return entity.NetworkId.id === packet.id;
  });
  if (!it) return;
  console.log("Hey");
  it.Position.x = packet.position.x;
  it.Position.y = packet.position.y;
  it.Velocity.x = packet.velocity.x;
  it.Velocity.y = packet.velocity.y;
}
