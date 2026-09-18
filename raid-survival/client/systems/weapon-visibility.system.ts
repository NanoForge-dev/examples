import { type Registry } from "@nanoforge-dev/ecs-client";

import { NetworkId } from "../components/network-id.component";
import { ChildrenComponent } from "../components/children.component";
import { Weapon } from "../components/weapon.component";
import { SpriteComponent } from "../components/renderable/sprite.component";
import { playerId } from "../main";

// Hides the weapon sprite for every player with nothing equipped, except the local player -
// build-mode.system.ts already owns that one entirely (it also factors in build-mode visibility).
export function weaponVisibilitySystem(registry: Registry) {
  const players: { id: number; NetworkId: NetworkId }[] = registry.getIndexedZipper([NetworkId]);
  const localPlayer = players.find((p) => p.NetworkId.id === playerId);

  const weapons: {
    Weapon: Weapon;
    ChildrenComponent: ChildrenComponent;
    SpriteComponent: SpriteComponent;
  }[] = registry.getZipper([Weapon, ChildrenComponent, SpriteComponent]);

  for (const w of weapons) {
    if (localPlayer && w.ChildrenComponent.parentId === localPlayer.id) continue;
    w.SpriteComponent.sprite?.visible(w.Weapon.weaponType !== null);
  }
}

// * Required to generate code
export default weaponVisibilitySystem.name;
