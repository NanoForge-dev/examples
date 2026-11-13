import type { Registry } from "@nanoforge-dev/ecs/client";

import { Velocity2D } from "../components/velocity-2d.component";
import { SpriteComponent } from "../components/sprite.component";
import { Direction } from "../components/direction.component";

export const spriteAnimator = (registry: Registry) => {
  const entities: {
    Direction: Direction;
    SpriteComponent: SpriteComponent;
    Velocity2D: Velocity2D;
  }[] = registry.getZipper([Direction, SpriteComponent, Velocity2D]);

  entities.forEach(({ Direction, SpriteComponent, Velocity2D }) => {
    if (!SpriteComponent.sprite) return;
    // player-death.system.ts owns this animation while set - only it ever clears "death" again
    // (on revive), so this system must never override it back to walk/idle on its own.
    if (SpriteComponent.getAnimation() === "death") return;
    if ((Velocity2D.y != 0 || Velocity2D.x != 0) && SpriteComponent.getAnimation() != "walk") {
      SpriteComponent.setAnimation("walk");
    } else if (Velocity2D.x == 0 && Velocity2D.y == 0 && SpriteComponent.getAnimation() != "idle") {
      SpriteComponent.setAnimation("idle");
    }

    if (Direction.x < 0 && !SpriteComponent.isFlipped()) {
      SpriteComponent.flip();
    } else if (Direction.x > 0 && SpriteComponent.isFlipped()) {
      SpriteComponent.unflip();
    }
  });
};
