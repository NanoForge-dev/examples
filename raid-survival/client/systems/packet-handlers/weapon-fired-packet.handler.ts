import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { Weapon } from "../../components/weapon.component";
import { ChildrenComponent } from "../../components/children.component";

// A one-shot "a shot was actually fired" event, broadcast by server/systems/weapon.system.ts at
// the exact moment it fires (not derived from client input state, so every player's shots
// animate, not just the local one - see ShootController, which only ever reflects the LOCAL
// player's held fire button, not whether a shot actually left the gun). Purely a visual trigger -
// weapon-reload-animation.system.ts owns turning this into an actual animation and expiring it
// again; this handler just flips the flag and resets the clock.
export function weaponFiredPacketHandler(packet: any, registry: Registry): void {
  const players: { id: number; NetworkId: NetworkId }[] = registry.getIndexedZipper([NetworkId]);
  const player = players.find((p) => p.NetworkId.id === packet.id);
  if (!player) return;

  const weapons: { Weapon: Weapon; ChildrenComponent: ChildrenComponent }[] = registry.getZipper([
    Weapon,
    ChildrenComponent,
  ]);
  // Routed by hand AND weaponType, same as weapon-state-packet.handler.ts and for the same
  // reason: guards against a stale in-flight packet for a hand that's since been re-equipped to
  // something else.
  const match = weapons.find(
    (w) => w.ChildrenComponent.parentId === player.id && w.Weapon.hand === packet.hand && w.Weapon.weaponType === packet.weaponType,
  );
  if (!match) return;

  match.Weapon.firing = true;
  match.Weapon.firingElapsed = 0;
}
