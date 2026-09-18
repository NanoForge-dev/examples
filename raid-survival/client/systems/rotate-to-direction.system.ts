import type { Registry } from "@nanoforge-dev/ecs-client";
import { Direction } from "../components/direction.component";
import { DirectionRotatorComponent } from "../components/direction-rotator.component";
import { TransformComponent } from "../components/essentials/transform.component";
import { SpriteComponent } from "../components/renderable/sprite.component";

export function rotateToDirectionSystem(registry: Registry) {
  const entities: {
    id: number;
    TransformComponent: TransformComponent;
    Direction: Direction;
    DirectionRotatorComponent: DirectionRotatorComponent;
  }[] = registry.getIndexedZipper([TransformComponent, Direction, DirectionRotatorComponent]);

  for (const entity of entities) {
    // Not "return" - this only opts this one entity out, not every entity later in the zipper.
    if (!entity.DirectionRotatorComponent.enable) continue;

    const aimAngle = (Math.atan2(entity.Direction.y, entity.Direction.x) * 180) / Math.PI;
    const { offset, mirrorWhenFacingLeft } = entity.DirectionRotatorComponent;

    let flipped = false;
    if (mirrorWhenFacingLeft) {
      const sprite = registry.getEntityComponent(registry.entityFromIndex(entity.id), SpriteComponent);
      if (sprite) {
        // Direction.x === 0 leaves the current flip state alone, avoiding flicker aiming exactly
        // up/down.
        if (entity.Direction.x < 0 && !sprite.isFlippedY()) {
          sprite.flipY();
        } else if (entity.Direction.x > 0 && sprite.isFlippedY()) {
          sprite.unflipY();
        }
        flipped = sprite.isFlippedY();
      } else {
        // spriteSystem creates the Konva node lazily - fall back to the intended flip state
        // directly so rotation is still correct the instant the sprite appears.
        flipped = entity.Direction.x < 0;
      }
    }

    // Konva applies scale (flipY) before rotation, which flips the sign of the resulting visual
    // angle when flipped - rotation must be solved separately in that case, or the sprite ends up
    // pointing roughly 2*offset degrees away from the actual aim direction.
    entity.TransformComponent.rotation = flipped ? aimAngle - offset : aimAngle + offset;
  }
}