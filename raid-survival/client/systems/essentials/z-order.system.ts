import { ZIndexComponent } from "../../components/essentials/z-index.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { Registry } from "@nanoforge-dev/ecs-client";

let lastOrder: number[] = [];

export function zOrderSystem(registry: Registry) {
  const entities: {ZIndexComponent: ZIndexComponent, SpriteComponent: SpriteComponent}[] = registry.getZipper([ZIndexComponent, SpriteComponent]);
  const sorted = [...entities].sort((a, b) => a.ZIndexComponent.value - b.ZIndexComponent.value);

  const currentOrder = sorted.map((e) => e.SpriteComponent.sprite?._id ?? -1);
  const changed =
    currentOrder.length !== lastOrder.length || currentOrder.some((id, i) => id !== lastOrder[i]);

  if (!changed) return;

  sorted.forEach(({ SpriteComponent: sc }) => sc.sprite?.moveToTop());
  lastOrder = currentOrder;
}