import { type Registry } from "@nanoforge-dev/ecs-client";

import { Player } from "../components/player.component";
import { Health } from "../components/health.component";
import { SpriteComponent } from "../components/renderable/sprite.component";

// The only thing that ever sets a player's animation to "death" - once set, it's permanent (no
// respawn support yet, matching game-over.system.ts server-side: the whole match ends once every
// player is dead). sprite-animator.system.ts is guarded to never override it back to walk/idle.
export function playerDeathSystem(registry: Registry) {
  const entities: { Player: Player; Health: Health; SpriteComponent: SpriteComponent }[] = registry.getZipper([
    Player,
    Health,
    SpriteComponent,
  ]);

  for (const { Health: health, SpriteComponent: sprite } of entities) {
    if (health.current <= 0) {
      sprite.setAnimation("death");
    }
  }
}

// * Required to generate code
export default playerDeathSystem.name;
