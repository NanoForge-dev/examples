import { Registry } from "@nanoforge-dev/ecs-client";
import { AmmoHudComponent } from "../../components/ammo-hud.component";
import { WeaponShopComponent } from "../../components/weapon-shop.component";
import { playerId } from "../../main";

export function ammoPacketHandler(packet: any, registry: Registry): void {
  // Only the local player has an ammo HUD/shop at all - it's a personal readout, not a per-player
  // one.
  if (packet.id !== playerId) return;

  const reserve = packet.reserveAmmo === -1 ? "∞" : packet.reserveAmmo;

  const shops: { WeaponShopComponent: WeaponShopComponent }[] = registry.getZipper([
    WeaponShopComponent,
  ]);
  const shop = shops[0]?.WeaponShopComponent;

  const huds: { AmmoHudComponent: AmmoHudComponent }[] = registry.getZipper([AmmoHudComponent]);
  for (const { AmmoHudComponent: hud } of huds) {
    hud.text.text(`${packet.magazineAmmo} / ${reserve}`);
  }

  // Also the source of truth for the shop panel's reserve display, so it doesn't go stale between
  // buy/refill/equip broadcasts.
  if (shop) {
    shop.owned.set(packet.weaponType, { reserveAmmo: packet.reserveAmmo });
  }
}
