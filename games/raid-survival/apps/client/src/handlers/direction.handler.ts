import type { Registry } from "@nanoforge-dev/ecs/client";
import type { ServerMessageOf } from "@raid-survival/shared/protocol";

import { Direction } from "../components/direction.component";
import { NetworkId } from "../components/network-id.component";

export const directionHandler = (
  packet: ServerMessageOf<"direction">,
  registry: Registry,
): void => {
  const zipper = registry.getZipper([NetworkId, Direction]);
  const it = zipper.find((entity) => {
    return entity.NetworkId.id === packet.id;
  });
  if (!it) return;
  it.Direction.x = packet.direction.x;
  it.Direction.y = packet.direction.y;
};
