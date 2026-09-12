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
// know what to render in every player's hands. Re-points the weapon sprite (animation, visibility
// comes from weapon-visibility.system.ts/build-mode.system.ts reacting to Weapon.weaponType next
// tick) to match the broadcast state.
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
      // Not mid-reload any more - a fresh weaponState packet will re-set this correctly if the
      // newly-equipped weapon actually is reloading.
      weaponEntry.Weapon.reloading = false;
      weaponEntry.Weapon.reloadElapsed = 0;
      // No explicit sprite update here - weapon-reload-animation.system.ts's own per-tick pass
      // already re-asserts the correct spriteKey/animationsKey/scale/animation for whatever
      // weapon.weaponType now is, idempotently, every tick (each weapon can live on its own source
      // image - client/weapon-catalog.ts's spriteKey/animationsKey - so a re-equip can mean a real
      // image swap, not just a different animation name within the same image).
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

  // Re-point the ammo-HUD icon (animation + fit-scale) to whatever weapon is now equipped - built
  // once at spawn time in start-game-packet.handler.ts and otherwise never touched again, so
  // switching weapons would otherwise leave the row showing the OLD weapon's icon (wrong crop,
  // wrong scale) while ammo-packet.handler.ts's text update correctly reflects the new one.
  // Visibility is handled separately, every tick, by reload-indicator.system.ts.
  const huds: { AmmoHudComponent: AmmoHudComponent }[] = registry.getZipper([AmmoHudComponent]);
  for (const { AmmoHudComponent: hud } of huds) {
    const newType = shop.equippedWeaponType;
    if (!newType) continue;
    const catalog = WEAPON_CATALOG[newType];
    const fitScale = Math.min(
      AMMO_ICON_SIZE.width / catalog.iconSize.width,
      AMMO_ICON_SIZE.height / catalog.iconSize.height,
    );
    // Each weapon can live on its own source image now (spriteKey/animationsKey) - switching to a
    // different weapon type can mean a real image swap, not just a different animation name
    // within the same image, so setAnimation alone isn't enough here the way it used to be when
    // every weapon shared weapons.png.
    if (hud.icon.spriteKey !== catalog.spriteKey) {
      hud.icon.setSpriteKey(catalog.spriteKey, catalog.animationsKey);
    }
    hud.icon.setAnimation(catalog.iconAnimation);
    hud.icon.setScale({ x: fitScale, y: fitScale });
  }
}
