import { type Registry } from "@nanoforge-dev/ecs-client";

import { NetworkId } from "../components/network-id.component";
import { ChildrenComponent } from "../components/children.component";
import { Weapon } from "../components/weapon.component";
import { SpriteComponent } from "../components/renderable/sprite.component";
import { playerId } from "../main";

// A hand with nothing equipped (Weapon.weaponType === null) shows no weapon sprite at all - for
// every player EXCEPT the local one, which build-mode.system.ts already owns entirely (it folds
// in both "is this hand equipped" AND "is build mode open", since the local player's weapon also
// hides while placing buildings - a concern that doesn't apply to anyone else's rendering). This
// system is what makes an unequipped hand show nothing for every OTHER player on screen, and
// keeps the local player's own weapon visible again once build-mode.system.ts stops touching it.
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
