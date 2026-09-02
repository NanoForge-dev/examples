import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { FloatingTextComponent } from "../components/floating-text.component";
import { TextComponent } from "../components/renderable/text.component";

// World-layer-local px/sec (the loot text lives on the 3x-scaled world layer, same space as
// zombies/players - see loot-packet.handler.ts).
const RISE_SPEED = 8;

export function floatingTextSystem(registry: Registry, ctx: Context) {
  const entities: {
    id: number;
    FloatingTextComponent: FloatingTextComponent;
    TextComponent: TextComponent;
  }[] = registry.getIndexedZipper([FloatingTextComponent, TextComponent]);
  if (entities.length === 0) return;

  const delta = ctx.app.delta / 1000;

  for (const entity of entities) {
    const floating = entity.FloatingTextComponent;
    const node = entity.TextComponent.text;

    floating.elapsed += delta;
    if (floating.elapsed >= floating.duration) {
      // This entity is never touched by a server "kill" packet, so it needs its own explicit
      // destroy - registry.killEntity() alone (see kill-packet.handler.ts's fix) never reaches
      // the underlying Konva node.
      node.destroy();
      registry.killEntity(registry.entityFromIndex(entity.id));
      continue;
    }

    node.y(node.y() - RISE_SPEED * delta);
    node.opacity(1 - floating.elapsed / floating.duration);
    // A raw Konva Text, not a SpriteComponent - it can't join zOrderSystem (same trap the
    // build-mode grid/preview hit), so it needs the same remedy: force it above whatever's
    // z-indexed every tick it's alive.
    node.moveToTop();
  }
}

// * Required to generate code
export default floatingTextSystem.name;
