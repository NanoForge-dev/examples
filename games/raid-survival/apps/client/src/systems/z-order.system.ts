import type { Registry } from "@nanoforge-dev/ecs/client";

import { DrawOrder2D } from "../components/draw-order-2d.component";
import { SpriteComponent } from "../components/sprite.component";

let lastOrder: number[] = [];

export const zOrderSystem = (registry: Registry) => {
  const entities: { DrawOrder2D: DrawOrder2D; SpriteComponent: SpriteComponent }[] =
    registry.getZipper([DrawOrder2D, SpriteComponent]);
  const sorted = [...entities].sort((a, b) => a.DrawOrder2D.z - b.DrawOrder2D.z);

  const currentOrder = sorted.map((e) => e.SpriteComponent.sprite?._id ?? -1);
  const changed =
    currentOrder.length !== lastOrder.length || currentOrder.some((id, i) => id !== lastOrder[i]);

  if (!changed) return;

  sorted.forEach(({ SpriteComponent: sc }) => sc.sprite?.moveToTop());
  lastOrder = currentOrder;
};
