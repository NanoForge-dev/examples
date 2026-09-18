import { Registry } from "@nanoforge-dev/ecs-client";
import { TransformComponent } from "../../components/essentials/transform.component";
import { Velocity } from "../../components/essentials/velocity.component";
import { NetworkId } from "../../components/network-id.component";

export function movePacketHandler(packet: any, registry: Registry): void {
  const zipper = registry.getZipper([NetworkId, TransformComponent, Velocity]);
  const it = zipper.find((entity) => {
    return entity.NetworkId.id === packet.id;
  });
  if (!it) return;

  it.TransformComponent.x = packet.position.x;
  it.TransformComponent.y = packet.position.y;
  it.Velocity.x = packet.velocity.x;
  it.Velocity.y = packet.velocity.y;
}
