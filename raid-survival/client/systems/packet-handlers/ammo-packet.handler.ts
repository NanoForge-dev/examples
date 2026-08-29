import { Registry } from "@nanoforge-dev/ecs-client";
import { AmmoHudComponent } from "../../components/ammo-hud.component";
import { playerId } from "../../main";

export function ammoPacketHandler(packet: any, registry: Registry): void {
  // Only the local player has an ammo HUD at all - it's a personal readout, not a per-player one.
  if (packet.id !== playerId) return;

  const entities: { AmmoHudComponent: AmmoHudComponent }[] = registry.getZipper([AmmoHudComponent]);
  const hud = entities[0]?.AmmoHudComponent;
  if (!hud) return;

  const reserve = packet.reserveAmmo === -1 ? "∞" : packet.reserveAmmo;
  hud.text.text(`${packet.magazineAmmo} / ${reserve}`);
}
