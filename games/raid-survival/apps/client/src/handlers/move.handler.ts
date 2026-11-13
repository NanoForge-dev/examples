import type { ServerMessageOf } from "@raid-survival/shared/protocol";
import type { Registry } from "@nanoforge-dev/ecs/client";
import { TransformComponent } from "../components/transform.component";
import { Velocity } from "../components/velocity.component";
import { NetworkId } from "../components/network-id.component";

export const moveHandler = (packet: ServerMessageOf<"move">, registry: Registry): void => {
  const zipper = registry.getZipper([NetworkId, TransformComponent, Velocity]);
  const it = zipper.find((entity) => {
    return entity.NetworkId.id === packet.id;
  });
  if (!it) return;

  it.TransformComponent.x = packet.position.x;
  it.TransformComponent.y = packet.position.y;
  it.Velocity.x = packet.velocity.x;
  it.Velocity.y = packet.velocity.y;
};
