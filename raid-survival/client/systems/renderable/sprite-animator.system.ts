import { type Registry } from "@nanoforge-dev/ecs-client";
import { Velocity } from "../../components/velocity.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { Direction } from "../../components/direction.component";

export const spriteAnimator = (registry: Registry) => {
  const entities: {Direction: Direction, SpriteComponent: SpriteComponent, Velocity: Velocity}[] = registry.getZipper([Direction, SpriteComponent, Velocity]);

  entities.forEach(({ Direction, SpriteComponent, Velocity }) => {
    if (!SpriteComponent.sprite) return;
    if ((Velocity.y != 0 || Velocity.x != 0) && SpriteComponent.getAnimation() != "walk") {
      SpriteComponent.setAnimation("walk");
    } else if (Velocity.x == 0 && Velocity.y == 0 && SpriteComponent.getAnimation() != "idle") {
      SpriteComponent.setAnimation("idle");
    }

    if (Direction.x < 0 && !SpriteComponent.isFlipped()) {
      SpriteComponent.flip();
    } else if (Direction.x > 0 && SpriteComponent.isFlipped()) {
      SpriteComponent.unflip();
    }
  });
};
