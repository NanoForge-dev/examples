import { type Registry } from "@nanoforge-dev/ecs-client";
import { Velocity } from "../../components/velocity.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { Direction } from "../../components/direction.component";

export const spriteAnimator = (registry: Registry) => {
  const entities = registry.getZipper([Direction, SpriteComponent, Velocity]);

  entities.forEach(({ Direction, RenderableComponent, Velocity }) => {
    if (!RenderableComponent.sprite) return;
    if (Velocity.y != 0 || (Velocity.x != 0 && RenderableComponent.getAnimation() != "walk")) {
      RenderableComponent.setAnimation("walk");
    } else if (Velocity.x == 0 && RenderableComponent.getAnimation() != "idle") {
      RenderableComponent.setAnimation("idle");
    }

    if (Direction.x < 0 && !RenderableComponent.isFlipped()) {
      RenderableComponent.flip();
    } else if (Direction.x > 0 && RenderableComponent.isFlipped()) {
      RenderableComponent.unflip();
    }
  });
};
