import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { ChildrenComponent } from "../../components/children.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { ReviveIndicatorComponent } from "../../components/revive-indicator.component";
import { ReviveHintIndicatorComponent } from "../../components/revive-hint-indicator.component";
import { ReloadIndicatorComponent } from "../../components/reload-indicator.component";
import { BuildingInteractIndicatorComponent } from "../../components/building-interact-indicator.component";

// registry.killEntity() only removes ECS-level components - the WASM ECS core has no knowledge of
// Konva, so it can't touch the actual rendered node. Destroys every component type that owns one
// directly, not just SpriteComponent (several indicators wrap a Text/Ring/Arc instead).
function destroySprite(registry: Registry, entityId: number): void {
  const entity = registry.entityFromIndex(entityId);
  registry.getEntityComponent(entity, SpriteComponent)?.sprite?.destroy();
  registry.getEntityComponent(entity, ReviveIndicatorComponent)?.background.destroy();
  registry.getEntityComponent(entity, ReviveIndicatorComponent)?.fill.destroy();
  registry.getEntityComponent(entity, ReviveHintIndicatorComponent)?.text.destroy();
  registry.getEntityComponent(entity, ReloadIndicatorComponent)?.text.destroy();
  registry.getEntityComponent(entity, BuildingInteractIndicatorComponent)?.text.destroy();
}

export function killPacketHandler(packet: any, registry: Registry): void {
  const zipper = registry.getIndexedZipper([NetworkId]);
  const it = zipper.find((entity) => {
    return entity.NetworkId.id === packet.id;
  });
  if (!it) return;

  // Cascade to locally-built children (health bar frame/fill, etc.) - they have no NetworkId of
  // their own, only a ChildrenComponent, so they'd otherwise be orphaned on screen forever.
  const children: { id: number; ChildrenComponent: ChildrenComponent }[] =
    registry.getIndexedZipper([ChildrenComponent]);
  for (const child of children) {
    if (child.ChildrenComponent.parentId === it.id) {
      destroySprite(registry, child.id);
      registry.killEntity(registry.entityFromIndex(child.id));
    }
  }

  destroySprite(registry, it.id);
  registry.killEntity(registry.entityFromIndex(it.id));
}
