import { type Registry } from "@nanoforge-dev/ecs-client";

import { NetworkId } from "../components/network-id.component";
import { ChildrenComponent } from "../components/children.component";
import { Weapon } from "../components/weapon.component";
import { ReloadIndicatorComponent } from "../components/reload-indicator.component";
import { AmmoHudComponent } from "../components/ammo-hud.component";
import { SpriteComponent } from "../components/renderable/sprite.component";
import { WEAPON_CATALOG } from "../weapon-catalog";
import { AMMO_ICON_SIZE } from "./packet-handlers/start-game-packet.handler";
import { playerId } from "../main";

// Owns two related, LOCAL-player-only HUD concerns, both driven off the same per-hand weapon
// lookup: the "RELOAD!" sprite's visibility (only while that hand's weapon is mid-reload), and
// each ammo-HUD row's visibility (only while that hand has anything equipped at all - a hand with
// nothing assigned shows no icon/text/reload sprite, same look the single-weapon HUD had before
// two hands existed). Driven every tick, not just on the equip/reload-state-change event -
// spriteSystem creates the underlying Konva node lazily, so a one-shot visible() call made before
// it exists would silently no-op forever.
export function reloadIndicatorSystem(registry: Registry) {
  const players: { id: number; NetworkId: NetworkId }[] = registry.getIndexedZipper([NetworkId]);
  const player = players.find((p) => p.NetworkId.id === playerId);

  const weapons: { Weapon: Weapon; ChildrenComponent: ChildrenComponent }[] = registry.getZipper([
    Weapon,
    ChildrenComponent,
  ]);
  const findWeapon = (hand: "left" | "right") =>
    player ? weapons.find((w) => w.ChildrenComponent.parentId === player.id && w.Weapon.hand === hand) : undefined;

  const indicators: { SpriteComponent: SpriteComponent; ReloadIndicatorComponent: ReloadIndicatorComponent }[] =
    registry.getZipper([ReloadIndicatorComponent, SpriteComponent]);
  for (const { SpriteComponent: sprite, ReloadIndicatorComponent: indicator } of indicators) {
    const weapon = findWeapon(indicator.hand);
    sprite.sprite?.visible(!!weapon?.Weapon.weaponType && !!weapon.Weapon.reloading);
  }

  const ammoHuds: { AmmoHudComponent: AmmoHudComponent }[] = registry.getZipper([AmmoHudComponent]);
  for (const { AmmoHudComponent: hud } of ammoHuds) {
    const weapon = findWeapon(hud.hand);
    const equipped = !!weapon?.Weapon.weaponType;
    hud.text.visible(equipped);
    hud.icon.sprite?.visible(equipped);

    // Same idempotent-every-tick correction as weapon-reload-animation.system.ts applies to the
    // held weapon, and the same reason: buildAmmoHud calls setAnimation() once at construction,
    // before the icon's Konva sprite exists - spriteSystem always builds it hardcoded on "idle"
    // regardless, so that call's effect was silently swallowed the first time the sprite actually
    // loaded (masked for smallGun, whose iconAnimation IS "idle" - visible for anything else,
    // until the first equip change happened to re-trigger it).
    if (weapon?.Weapon.weaponType && hud.icon.sprite) {
      const iconCatalog = WEAPON_CATALOG[weapon.Weapon.weaponType];
      if (hud.icon.getAnimation() !== iconCatalog.iconAnimation) {
        const fitScale = Math.min(AMMO_ICON_SIZE.width / iconCatalog.iconSize.width, AMMO_ICON_SIZE.height / iconCatalog.iconSize.height);
        hud.icon.setAnimation(iconCatalog.iconAnimation);
        hud.icon.setScale({ x: fitScale, y: fitScale });
      }
    }
  }
}

// * Required to generate code
export default reloadIndicatorSystem.name;
