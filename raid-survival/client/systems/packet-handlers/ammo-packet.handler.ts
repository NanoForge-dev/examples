import { Registry } from "@nanoforge-dev/ecs-client";
import { AmmoHudComponent } from "../../components/ammo-hud.component";
import { WeaponShopComponent } from "../../components/weapon-shop.component";
import { playerId } from "../../main";

export function ammoPacketHandler(packet: any, registry: Registry): void {
  // Only the local player has an ammo HUD/shop at all - it's a personal readout, not a per-player
  // one.
  if (packet.id !== playerId) return;

  const reserve = packet.reserveAmmo === -1 ? "∞" : packet.reserveAmmo;

  const shops: { WeaponShopComponent: WeaponShopComponent }[] = registry.getZipper([WeaponShopComponent]);
  const shop = shops[0]?.WeaponShopComponent;

  // Routed by packet.hand AND that hand's currently-equipped type, not by weaponType alone - each
  // hand has its own independent magazine (see weapon-inventory.component.ts, server), and the
  // weaponType re-check guards against a stale in-flight packet for a hand that's since been
  // re-equipped to something else.
  const huds: { AmmoHudComponent: AmmoHudComponent }[] = registry.getZipper([AmmoHudComponent]);
  for (const { AmmoHudComponent: hud } of huds) {
    const equippedType = hud.hand === "left" ? shop?.leftWeaponType : shop?.rightWeaponType;
    if (hud.hand === packet.hand && equippedType === packet.weaponType) {
      hud.text.text(`${packet.magazineAmmo} / ${reserve}`);
    }
  }

  // This is the single source of truth for the shop panel's "current reserve" display too -
  // without writing here, it would only ever reflect the last buy/refill/equip
  // (weaponInventory broadcast), going stale the instant the weapon is actually fired or reloaded.
  // Reserve only, not magazine - see OwnedWeaponAmmo (reserve is shared per weapon type, magazine
  // is per-hand now, so there's no single "the" magazine value a per-type shop entry could show).
  if (shop) {
    shop.owned.set(packet.weaponType, { reserveAmmo: packet.reserveAmmo });
  }
}
