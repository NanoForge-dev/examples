import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { Weapon } from "../../components/weapon.component";
import { ChildrenComponent } from "../../components/children.component";

// Server-broadcast at the exact moment a shot fires, so every player's shots animate (not just
// the local one). Purely a visual trigger - weapon-reload-animation.system.ts turns this into an
// actual animation.
export function weaponFiredPacketHandler(packet: any, registry: Registry): void {
  const players: { id: number; NetworkId: NetworkId }[] = registry.getIndexedZipper([NetworkId]);
  const player = players.find((p) => p.NetworkId.id === packet.id);
  if (!player) return;

  const weapons: { Weapon: Weapon; ChildrenComponent: ChildrenComponent }[] = registry.getZipper([
    Weapon,
    ChildrenComponent,
  ]);
  // Routed by weaponType to guard against a stale packet for a weapon since unequipped.
  const match = weapons.find(
    (w) => w.ChildrenComponent.parentId === player.id && w.Weapon.weaponType === packet.weaponType,
  );
  if (!match) return;

  match.Weapon.firing = true;
  match.Weapon.firingElapsed = 0;
}
