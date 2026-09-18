import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { FloatingTextComponent } from "../components/floating-text.component";
import { TextComponent } from "../components/renderable/text.component";

const RISE_SPEED = 8; // world-layer-local px/sec

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
      // Never touched by a server "kill" packet - needs its own explicit destroy since
      // registry.killEntity() alone never reaches the underlying Konva node.
      node.destroy();
      registry.killEntity(registry.entityFromIndex(entity.id));
      continue;
    }

    node.y(node.y() - RISE_SPEED * delta);
    node.opacity(1 - floating.elapsed / floating.duration);
    // No SpriteComponent, so zOrderSystem never manages it - force it on top every tick instead.
    node.moveToTop();
  }
}

// * Required to generate code
export default floatingTextSystem.name;
