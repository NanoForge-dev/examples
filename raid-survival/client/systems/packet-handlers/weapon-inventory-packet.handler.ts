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

// Handles a buy/ammo-refill/equip result for ANY player, not just local - every client needs to
// know what to render in every player's hands. Re-points each hand's weapon sprite (animation,
// visibility comes from weapon-visibility.system.ts/build-mode.system.ts reacting to
// Weapon.weaponType next tick) to match the broadcast state.
export function weaponInventoryPacketHandler(packet: any, registry: Registry): void {
  const players: { id: number; NetworkId: NetworkId }[] = registry.getIndexedZipper([NetworkId]);
  const player = players.find((p) => p.NetworkId.id === packet.id);
  if (!player) return;

  const weapons: {
    Weapon: Weapon;
    ChildrenComponent: ChildrenComponent;
    SpriteComponent: SpriteComponent;
  }[] = registry.getZipper([Weapon, ChildrenComponent, SpriteComponent]);
  const playerWeapons = weapons.filter((w) => w.ChildrenComponent.parentId === player.id);

  for (const hand of ["left", "right"] as const) {
    const weaponEntry = playerWeapons.find((w) => w.Weapon.hand === hand);
    if (!weaponEntry) continue;

    const newType: WeaponType | null = hand === "left" ? packet.leftWeaponType : packet.rightWeaponType;
    if (weaponEntry.Weapon.weaponType === newType) continue;

    weaponEntry.Weapon.weaponType = newType;
    weaponEntry.Weapon.baseRotationOffset = newType ? WEAPON_CATALOG[newType].rotationOffset : 0;
    // Not mid-reload any more from this hand's perspective - a fresh weaponState packet will
    // re-set this correctly if the newly-equipped weapon actually is reloading.
    weaponEntry.Weapon.reloading = false;
    weaponEntry.Weapon.reloadElapsed = 0;
    // No explicit sprite update here - weapon-reload-animation.system.ts's own per-tick pass
    // already re-asserts the correct spriteKey/animationsKey/scale/animation for whatever
    // weapon.weaponType now is, idempotently, every tick (each weapon can live on its own source
    // image - client/weapon-catalog.ts's spriteKey/animationsKey - so a re-equip can mean a real
    // image swap, not just a different animation name within the same image). It'll pick this
    // change up on its own next pass; a dedicated reload asset, when a weapon has one, is still a
    // separate overlay sprite shown/hidden instead of ever swapping the main sprite mid-reload.
  }

  // Local-only: keep the shop panel's "what do I own / what's equipped where" state in sync.
  if (packet.id !== playerId) return;

  const shops: { WeaponShopComponent: WeaponShopComponent }[] = registry.getZipper([WeaponShopComponent]);
  const shop = shops[0]?.WeaponShopComponent;
  if (!shop) return;

  shop.leftWeaponType = packet.leftWeaponType ?? null;
  shop.rightWeaponType = packet.rightWeaponType ?? null;
  for (const w of packet.weapons ?? []) {
    shop.owned.set(w.weaponType, { reserveAmmo: w.reserveAmmo });
  }

  // Re-point each hand's ammo-HUD icon (animation + fit-scale) to whatever weapon now occupies
  // it - built once at spawn time in start-game-packet.handler.ts and otherwise never touched
  // again, so re-equipping a hand to a different weapon type would otherwise leave that row
  // showing the OLD weapon's icon (wrong crop, wrong scale) while ammo-packet.handler.ts's text
  // update correctly reflects the new one. Visibility is handled separately, every tick, by
  // reload-indicator.system.ts.
  const huds: { AmmoHudComponent: AmmoHudComponent }[] = registry.getZipper([AmmoHudComponent]);
  for (const { AmmoHudComponent: hud } of huds) {
    const newType: WeaponType | null = hud.hand === "left" ? shop.leftWeaponType : shop.rightWeaponType;
    if (!newType) continue;
    const catalog = WEAPON_CATALOG[newType];
    const fitScale = Math.min(AMMO_ICON_SIZE.width / catalog.iconSize.width, AMMO_ICON_SIZE.height / catalog.iconSize.height);
    // Each weapon can live on its own source image now (spriteKey/animationsKey) - re-equipping
    // to a different weapon type can mean a real image swap, not just a different animation name
    // within the same image, so setAnimation alone isn't enough here the way it used to be when
    // every weapon shared weapons.png.
    if (hud.icon.spriteKey !== catalog.spriteKey) {
      hud.icon.setSpriteKey(catalog.spriteKey, catalog.animationsKey);
    }
    hud.icon.setAnimation(catalog.iconAnimation);
    hud.icon.setScale({ x: fitScale, y: fitScale });
  }
}
