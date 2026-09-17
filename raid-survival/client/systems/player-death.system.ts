import { type Registry } from "@nanoforge-dev/ecs-client";

import { Player } from "../components/player.component";
import { Health } from "../components/health.component";
import { SpriteComponent } from "../components/renderable/sprite.component";

// The only thing that sets a player's animation to "death", and the only thing that clears it
// again on revive. sprite-animator.system.ts is guarded to never override "death" on its own.
export function playerDeathSystem(registry: Registry) {
  const entities: { Player: Player; Health: Health; SpriteComponent: SpriteComponent }[] =
    registry.getZipper([Player, Health, SpriteComponent]);

  for (const { Health: health, SpriteComponent: sprite } of entities) {
    if (health.current <= 0) {
      sprite.setAnimation("death");

      // Konva's Sprite has no "play once, hold last frame" mode - it loops forever otherwise.
      // Stopping the ticker once it reaches the last frame freezes it there instead.
      const konvaSprite = sprite.sprite;
      if (konvaSprite?.isRunning()) {
        const frames = konvaSprite.animations()?.["death"];
        const lastFrameIndex = frames ? frames.length / 4 - 1 : 0;
        if (konvaSprite.frameIndex() >= lastFrameIndex) {
          konvaSprite.stop();
        }
      }
    } else if (sprite.getAnimation() === "death") {
      // Just revived - hand control back to spriteAnimator and restart the ticker stopped above.
      sprite.setAnimation("idle");
      sprite.sprite?.start();
    }
  }
}

// * Required to generate code
export default playerDeathSystem.name;
