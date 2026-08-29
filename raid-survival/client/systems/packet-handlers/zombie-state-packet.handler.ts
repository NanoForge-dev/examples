import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { TransformComponent } from "../../components/essentials/transform.component";
import { Velocity } from "../../components/essentials/velocity.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";

export function zombieStatePacketHandler(packet: any, registry: Registry): void {
  const entities: {
    NetworkId: NetworkId;
    TransformComponent: TransformComponent;
    Velocity: Velocity;
    SpriteComponent: SpriteComponent;
  }[] = registry.getZipper([NetworkId, TransformComponent, Velocity, SpriteComponent]);

  const entity = entities.find(({ NetworkId }) => NetworkId.id === packet.id);
  if (!entity) return;

  entity.TransformComponent.x = packet.position.x;
  entity.TransformComponent.y = packet.position.y;
  entity.Velocity.x = packet.velocity.x;
  entity.Velocity.y = packet.velocity.y;
  entity.SpriteComponent.setAnimation(packet.state === "attack" ? "attack" : "idle");
}
