import { type Registry } from "@nanoforge-dev/ecs-client";

import { Player } from "../components/player.component";
import { Health } from "../components/health.component";
import { SpriteComponent } from "../components/renderable/sprite.component";

// The only thing that ever sets a player's animation to "death" (and the only thing that clears
// it again on revive.system.ts bringing them back above 0 HP). sprite-animator.system.ts is
// guarded to never override "death" back to walk/idle on its own.
export function playerDeathSystem(registry: Registry) {
  const entities: { Player: Player; Health: Health; SpriteComponent: SpriteComponent }[] =
    registry.getZipper([Player, Health, SpriteComponent]);

  for (const { Health: health, SpriteComponent: sprite } of entities) {
    if (health.current <= 0) {
      sprite.setAnimation("death");

      // Konva's Sprite has no "play once, hold last frame" mode - left alone, its own
      // _updateIndex() (konva/lib/shapes/Sprite.js) always wraps frameIndex back to 0 once it
      // passes the animation's last frame, looping "death" forever. Stopping the sprite's
      // internal ticker the instant it reaches that last frame freezes it there instead. Guarded
      // on isRunning() so this is a no-op once already stopped, and setAnimation() above already
      // no-ops once "death" is set, so neither line does anything on the many ticks after this.
      const konvaSprite = sprite.sprite;
      if (konvaSprite?.isRunning()) {
        const frames = konvaSprite.animations()?.["death"];
        const lastFrameIndex = frames ? frames.length / 4 - 1 : 0;
        if (konvaSprite.frameIndex() >= lastFrameIndex) {
          konvaSprite.stop();
        }
      }
    } else if (sprite.getAnimation() === "death") {
      // Just revived (Health.current went from <=0 back to >0 - see revive.system.ts /
      // revive-packet.handler.ts). Hand control back to spriteAnimator by moving off "death", and
      // restart the Konva ticker stop() halted above - without start(), the sprite would sit
      // frozen on idle's first frame forever instead of animating again.
      sprite.setAnimation("idle");
      sprite.sprite?.start();
    }
  }
}

// * Required to generate code
export default playerDeathSystem.name;
