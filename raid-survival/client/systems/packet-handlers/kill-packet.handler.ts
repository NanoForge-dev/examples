import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { ChildrenComponent } from "../../components/children.component";

export function killPacketHandler(packet: any, registry: Registry): void {
  const zipper = registry.getIndexedZipper([NetworkId]);
  const it = zipper.find((entity) => {
    return entity.NetworkId.id === packet.id;
  });
  if (!it) return;

  // Cascade to any locally-built child entities (a health bar's frame/fill, say) - they have no
  // NetworkId of their own since the server never spawns them, only a ChildrenComponent pointing
  // back at this one. Without this they'd be orphaned: still on screen, frozen at their last
  // position forever.
  const children: { id: number; ChildrenComponent: ChildrenComponent }[] = registry.getIndexedZipper([
    ChildrenComponent,
  ]);
  for (const child of children) {
    if (child.ChildrenComponent.parentId === it.id) {
      registry.killEntity(registry.entityFromIndex(child.id));
    }
  }

  registry.killEntity(registry.entityFromIndex(it.id));
}
