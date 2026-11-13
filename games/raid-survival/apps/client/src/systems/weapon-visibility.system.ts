import type { Context } from "@nanoforge-dev/common";
import "@nanoforge-dev/scene";
import type { Registry } from "@nanoforge-dev/ecs/client";

import { NetworkId } from "../components/network-id.component";
import { ChildrenComponent } from "../components/children.component";
import { Weapon } from "../components/weapon.component";
import { SpriteComponent } from "../components/sprite.component";

/**
 * Hides the weapon sprite for every player with nothing equipped, except the local player - build-
 * mode.system.ts already owns that one entirely (it also factors in build-mode visibility).
 *
 * @system
 * @side client
 */
export const weaponVisibilitySystem = (registry: Registry, ctx: Context) => {
  const players: { id: number; NetworkId: NetworkId }[] = registry.getIndexedZipper([NetworkId]);
  const localPlayer = players.find((p) => p.NetworkId.id === ctx.scenes.vars.get("playerId"));

  const weapons: {
    Weapon: Weapon;
    ChildrenComponent: ChildrenComponent;
    SpriteComponent: SpriteComponent;
  }[] = registry.getZipper([Weapon, ChildrenComponent, SpriteComponent]);

  for (const w of weapons) {
    if (localPlayer && w.ChildrenComponent.parentId === localPlayer.id) continue;
    w.SpriteComponent.sprite?.visible(w.Weapon.weaponType !== null);
  }
};
