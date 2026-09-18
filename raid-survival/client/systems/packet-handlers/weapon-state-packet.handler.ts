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
  // weaponType re-check guards against a stale packet for a weapon that's since been unequipped.
  const match = weapons.find(
    (w) => w.ChildrenComponent.parentId === player.id && w.Weapon.weaponType === packet.weaponType,
  );
  if (!match) return;

  match.Weapon.reloading = packet.state === "reloading";
  match.Weapon.reloadElapsed = 0;
  // Only present on the "reloading" broadcast - lets the reload animation match the real duration.
  if (typeof packet.reloadSeconds === "number")
    match.Weapon.reloadDurationSeconds = packet.reloadSeconds;
}
