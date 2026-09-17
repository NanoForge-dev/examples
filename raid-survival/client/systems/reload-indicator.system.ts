import { type Registry } from "@nanoforge-dev/ecs-client";

import { NetworkId } from "../components/network-id.component";
import { ChildrenComponent } from "../components/children.component";
import { TransformComponent } from "../components/essentials/transform.component";
import { Weapon } from "../components/weapon.component";
import { ReloadIndicatorComponent } from "../components/reload-indicator.component";
import { AmmoHudComponent } from "../components/ammo-hud.component";
import { WEAPON_CATALOG } from "../weapon-catalog";
import { AMMO_ICON_SIZE } from "./packet-handlers/start-game-packet.handler";
import { playerId } from "../main";

// Two concerns off the same weapon-by-parent lookup: the world-space "Reloading..." label above
// every player's health bar (Text isn't a Sprite, so spriteSystem never repositions it - done
// here instead), and the local ammo-HUD row's visibility. Driven every tick, not just on state
// change, since spriteSystem creates the underlying Konva node lazily.
export function reloadIndicatorSystem(registry: Registry) {
  const weapons: { Weapon: Weapon; ChildrenComponent: ChildrenComponent }[] = registry.getZipper([
    Weapon,
    ChildrenComponent,
  ]);
  const findWeaponByParent = (parentId: number) =>
    weapons.find((w) => w.ChildrenComponent.parentId === parentId);

  const indicators: {
    ReloadIndicatorComponent: ReloadIndicatorComponent;
    ChildrenComponent: ChildrenComponent;
    TransformComponent: TransformComponent;
  }[] = registry.getZipper([ReloadIndicatorComponent, ChildrenComponent, TransformComponent]);
  for (const {
    ReloadIndicatorComponent: indicator,
    ChildrenComponent: child,
    TransformComponent: transform,
  } of indicators) {
    const weapon = findWeaponByParent(child.parentId);
    indicator.text.visible(!!weapon?.Weapon.weaponType && !!weapon.Weapon.reloading);
    indicator.text.position({ x: transform.x, y: transform.y });
  }

  // Local-only from here on.
  const players: { id: number; NetworkId: NetworkId }[] = registry.getIndexedZipper([NetworkId]);
  const localPlayer = players.find((p) => p.NetworkId.id === playerId);
  const localWeapon = localPlayer ? findWeaponByParent(localPlayer.id) : undefined;

  const ammoHuds: { AmmoHudComponent: AmmoHudComponent }[] = registry.getZipper([AmmoHudComponent]);
  for (const { AmmoHudComponent: hud } of ammoHuds) {
    const equipped = !!localWeapon?.Weapon.weaponType;
    hud.text.visible(equipped);
    hud.icon.sprite?.visible(equipped);

    // spriteSystem always builds a fresh Konva sprite hardcoded on "idle", so an initial
    // setAnimation() call made before the sprite exists gets silently swallowed - correct it here
    // every tick instead, same as weapon-reload-animation.system.ts does for the held weapon.
    if (localWeapon?.Weapon.weaponType && hud.icon.sprite) {
      const iconCatalog = WEAPON_CATALOG[localWeapon.Weapon.weaponType];
      if (hud.icon.getAnimation() !== iconCatalog.iconAnimation) {
        const fitScale = Math.min(
          AMMO_ICON_SIZE.width / iconCatalog.iconSize.width,
          AMMO_ICON_SIZE.height / iconCatalog.iconSize.height,
        );
        hud.icon.setAnimation(iconCatalog.iconAnimation);
        hud.icon.setScale({ x: fitScale, y: fitScale });
      }
    }
  }
}

// * Required to generate code
export default reloadIndicatorSystem.name;
