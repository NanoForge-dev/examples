import { Registry } from "@nanoforge-dev/ecs-client";
import { Position } from "../../components/position.component";
import { Velocity } from "../../components/velocity.component";
import { PlayerComponent } from "../../components/player.component";

export function movePacketHandler(packet: any, registry: Registry): void {
  const zipper = registry.getZipper([PlayerComponent, Position, Velocity]);
  console.log(packet, zipper);
  const it = zipper.find((entity) => {
    console.log(entity.PlayerComponent.id, packet.id);
    return entity.PlayerComponent.id === packet.id;
  });
  if (!it) return;
  console.log("Hey");
  it.Position.x = packet.position.x;
  it.Position.y = packet.position.y;
  it.Velocity.x = packet.velocity.x;
  it.Velocity.y = packet.velocity.y;
}
