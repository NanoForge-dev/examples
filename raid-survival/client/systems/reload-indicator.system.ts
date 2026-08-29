import { type Registry } from "@nanoforge-dev/ecs-client";

import { NetworkId } from "../components/network-id.component";
import { ChildrenComponent } from "../components/children.component";
import { Weapon } from "../components/weapon.component";
import { ReloadIndicatorComponent } from "../components/reload-indicator.component";
import { SpriteComponent } from "../components/renderable/sprite.component";
import { playerId } from "../main";

// Toggles the "RELOAD!" HUD sprite's visibility off the LOCAL player's weapon only - unlike
// weapon-reload-animation.system.ts (which drives every player's held-weapon tilt, correctly),
// this is a personal HUD readout, same scope as ammo-packet.handler.ts.
export function reloadIndicatorSystem(registry: Registry) {
  const indicators: { SpriteComponent: SpriteComponent }[] = registry.getZipper([ReloadIndicatorComponent, SpriteComponent]);
  const indicator = indicators[0]?.SpriteComponent;
  if (!indicator) return;

  const players: { id: number; NetworkId: NetworkId }[] = registry.getIndexedZipper([NetworkId]);
  const player = players.find((p) => p.NetworkId.id === playerId);
  if (!player) {
    indicator.sprite?.visible(false);
    return;
  }

  const weapons: { Weapon: Weapon; ChildrenComponent: ChildrenComponent }[] = registry.getZipper([
    Weapon,
    ChildrenComponent,
  ]);
  const weapon = weapons.find((w) => w.ChildrenComponent.parentId === player.id);

  // Driven every tick, not just once at construction - spriteSystem creates the underlying Konva
  // node lazily (on whatever later tick the image finishes loading), so a one-shot visible(false)
  // at build time would silently no-op on a sprite that doesn't exist yet.
  indicator.sprite?.visible(!!weapon?.Weapon.reloading);
}

// * Required to generate code
export default reloadIndicatorSystem.name;
