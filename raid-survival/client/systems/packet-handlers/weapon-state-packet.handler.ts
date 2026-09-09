import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { Weapon } from "../../components/weapon.component";
import { ChildrenComponent } from "../../components/children.component";

export function weaponStatePacketHandler(packet: any, registry: Registry): void {
  const players: { id: number; NetworkId: NetworkId }[] = registry.getIndexedZipper([NetworkId]);
  const player = players.find((p) => p.NetworkId.id === packet.id);
  if (!player) return;

  const weapons: { Weapon: Weapon; ChildrenComponent: ChildrenComponent }[] = registry.getZipper([
    Weapon,
    ChildrenComponent,
  ]);
  // The weaponType re-check guards against a stale in-flight packet for a weapon that's since
  // been unequipped: this packet is about a type that's no longer equipped, so whatever the
  // equip that replaced it already set should win, not this stale broadcast for the old weapon.
  const match = weapons.find(
    (w) => w.ChildrenComponent.parentId === player.id && w.Weapon.weaponType === packet.weaponType,
  );
  if (!match) return;

  match.Weapon.reloading = packet.state === "reloading";
  match.Weapon.reloadElapsed = 0;
  // Only present on the "reloading" broadcast (weapon.system.ts's broadcastWeaponState only
  // passes reloadSeconds there) - carried over so weapon-reload-animation.system.ts can time a
  // real animation to the actual duration instead of guessing one.
  if (typeof packet.reloadSeconds === "number")
    match.Weapon.reloadDurationSeconds = packet.reloadSeconds;
}
