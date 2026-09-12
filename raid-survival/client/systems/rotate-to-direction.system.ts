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
        // Direction.x === 0 leaves the current flip state alone (avoids flicker aiming exactly
        // up/down) - matches sprite-animator.system.ts's established hysteresis for the player
        // body's own left/right flip.
        if (entity.Direction.x < 0 && !sprite.isFlippedY()) {
          sprite.flipY();
        } else if (entity.Direction.x > 0 && sprite.isFlippedY()) {
          sprite.unflipY();
        }
        flipped = sprite.isFlippedY();
      } else {
        // spriteSystem creates the Konva node lazily, so isFlippedY() isn't meaningful yet on the
        // first few ticks - fall back to the intended flip state directly so rotation still comes
        // out right the instant the sprite does appear, instead of lagging a tick behind it.
        flipped = entity.Direction.x < 0;
      }
    }

    // Vertical mirroring (scaleY, applied by flipY() above) negates the local y component BEFORE
    // rotation is applied (Konva scales, then rotates), which flips the sign of the resulting
    // visual angle - so the rotation has to be solved for separately in that case, or the barrel
    // ends up pointing roughly 2*offset degrees away from the actual aim direction instead of at
    // it.
    entity.TransformComponent.rotation = flipped ? aimAngle - offset : aimAngle + offset;
  }
}