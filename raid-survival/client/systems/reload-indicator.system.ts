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

// Two related concerns, both driven off the same weapon-by-parent lookup:
//
// 1. The world-space "Reloading..." label above EVERY player's health bar (visible to everyone,
//    not just a local HUD) - shown only while that exact player's own equipped weapon is
//    reloading, and repositioned every tick from TransformComponent (Text isn't a Sprite, so
//    spriteSystem never moves it - same reasoning revive-indicator.system.ts documents for its
//    Arc/Ring).
// 2. The ammo-HUD row's visibility (LOCAL player only - it's a personal readout) - hidden
//    whenever nothing is equipped at all, same look the HUD had before dual wielding existed.
//
// Driven every tick, not just on the equip/reload-state-change event - spriteSystem creates the
// underlying Konva node lazily, so a one-shot visible() call made before it exists would silently
// no-op forever.
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

    // Same idempotent-every-tick correction as weapon-reload-animation.system.ts applies to the
    // held weapon, and the same reason: buildAmmoHud calls setAnimation() once at construction,
    // before the icon's Konva sprite exists - spriteSystem always builds it hardcoded on "idle"
    // regardless, so that call's effect was silently swallowed the first time the sprite actually
    // loaded (masked for smallGun, whose iconAnimation IS "idle" - visible for anything else,
    // until the first equip change happened to re-trigger it).
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
