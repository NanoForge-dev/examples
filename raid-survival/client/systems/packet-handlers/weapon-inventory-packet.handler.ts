import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { ChildrenComponent } from "../../components/children.component";
import { Weapon } from "../../components/weapon.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { WeaponShopComponent } from "../../components/weapon-shop.component";
import { AmmoHudComponent } from "../../components/ammo-hud.component";
import { WEAPON_CATALOG, type WeaponType } from "../../weapon-catalog";
import { AMMO_ICON_SIZE } from "./start-game-packet.handler";
import { playerId } from "../../main";

// Handles a buy/ammo-refill/equip result for any player - every client renders every player's
// weapon, not just its own.
export function weaponInventoryPacketHandler(packet: any, registry: Registry): void {
  const players: { id: number; NetworkId: NetworkId }[] = registry.getIndexedZipper([NetworkId]);
  const player = players.find((p) => p.NetworkId.id === packet.id);
  if (!player) return;

  const weapons: {
    Weapon: Weapon;
    ChildrenComponent: ChildrenComponent;
    SpriteComponent: SpriteComponent;
  }[] = registry.getZipper([Weapon, ChildrenComponent, SpriteComponent]);
  const weaponEntry = weapons.find((w) => w.ChildrenComponent.parentId === player.id);

  if (weaponEntry) {
    const newType: WeaponType | null = packet.weaponType ?? null;
    if (weaponEntry.Weapon.weaponType !== newType) {
      weaponEntry.Weapon.weaponType = newType;
      weaponEntry.Weapon.baseRotationOffset = newType ? WEAPON_CATALOG[newType].rotationOffset : 0;
      // A fresh weaponState packet will re-set this if the new weapon actually is reloading.
      weaponEntry.Weapon.reloading = false;
      weaponEntry.Weapon.reloadElapsed = 0;
      // No sprite update here - weapon-reload-animation.system.ts's per-tick pass already
      // re-asserts the correct sprite for whatever weaponType is now set.
    }
  }

  // Local-only: keep the shop panel's "what do I own / what's equipped" state in sync.
  if (packet.id !== playerId) return;

  const shops: { WeaponShopComponent: WeaponShopComponent }[] = registry.getZipper([
    WeaponShopComponent,
  ]);
  const shop = shops[0]?.WeaponShopComponent;
  if (!shop) return;

  shop.equippedWeaponType = packet.weaponType ?? null;
  for (const w of packet.weapons ?? []) {
    shop.owned.set(w.weaponType, { reserveAmmo: w.reserveAmmo });
  }

  // Re-point the ammo-HUD icon to whatever weapon is now equipped - it's built once at spawn and
  // otherwise never touched, so a weapon switch would leave the row showing the old icon.
  const huds: { AmmoHudComponent: AmmoHudComponent }[] = registry.getZipper([AmmoHudComponent]);
  for (const { AmmoHudComponent: hud } of huds) {
    const newType = shop.equippedWeaponType;
    if (!newType) continue;
    const catalog = WEAPON_CATALOG[newType];
    const fitScale = Math.min(
      AMMO_ICON_SIZE.width / catalog.iconSize.width,
      AMMO_ICON_SIZE.height / catalog.iconSize.height,
    );
    // Each weapon can live on its own source image, so a switch can mean a real image swap, not
    // just a different animation name - setAnimation alone isn't always enough.
    if (hud.icon.spriteKey !== catalog.spriteKey) {
      hud.icon.setSpriteKey(catalog.spriteKey, catalog.animationsKey);
    }
    hud.icon.setAnimation(catalog.iconAnimation);
    hud.icon.setScale({ x: fitScale, y: fitScale });
  }
}
