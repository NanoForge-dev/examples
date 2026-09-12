import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { ChildrenComponent } from "../../components/children.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { ReviveIndicatorComponent } from "../../components/revive-indicator.component";
import { ReviveHintIndicatorComponent } from "../../components/revive-hint-indicator.component";
import { ReloadIndicatorComponent } from "../../components/reload-indicator.component";
import { BuildingInteractIndicatorComponent } from "../../components/building-interact-indicator.component";

// registry.killEntity() only ever removes ECS-level components - @nanoforge-dev/ecs-client is a
// compiled WASM core with zero knowledge of graphics-2d/Konva, so it's structurally incapable of
// touching whatever raw Konva node a component wraps. Without this, a killed entity's rendering
// stays on screen forever (stopped, since nothing updates its Transform any more, but still
// visible) - this is what "kill" actually needs to mean client-side for anything renderable.
// Checks every component type that owns a Konva node directly (not just SpriteComponent) -
// building-interact-indicator/reload-indicator/revive-hint-indicator wrap a Text, revive-indicator
// wraps a Ring+Arc, none of them a SpriteComponent spriteSystem would otherwise clean up.
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

  // Cascade to any locally-built child entities (a health bar's frame/fill, say) - they have no
  // NetworkId of their own since the server never spawns them, only a ChildrenComponent pointing
  // back at this one. Without this they'd be orphaned: still on screen, frozen at their last
  // position forever.
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
