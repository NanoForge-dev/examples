import { type WeaponType } from "../weapon-catalog";

// Marker on a weapon child entity (parented to a player, same as the hand - see buildPlayer in
// start-game-packet.handler.ts). Every player now has TWO of these (one per hand) - `hand` and
// `weaponType` are what let weapon-state-packet.handler.ts, ammo-packet.handler.ts, and
// reload-indicator.system.ts pick the RIGHT one of a player's two weapon children via
// ChildrenComponent.parentId, instead of the old single-weapon `.find()`.
export class Weapon {
  name = this.constructor.name;

  constructor(
    public hand: "left" | "right",
    // null while this hand has nothing equipped - the sprite is hidden in that state (see
    // buildHandAndWeapon / weapon-inventory-packet.handler.ts).
    public weaponType: WeaponType | null,
    // The DirectionRotatorComponent offset this weapon normally rotates with (aim-tracking) -
    // weapon-reload-animation.system.ts adds an oscillating delta on top of this while reloading,
    // then restores it exactly once done, rather than hardcoding the base offset in two places.
    // Re-set by weapon-inventory-packet.handler.ts whenever the equipped type changes, since each
    // weapon's sprite has its own rest angle.
    public baseRotationOffset: number,
  ) {}

  reloading: boolean = false;
  // Local animation clock - only meaningful while reloading, reset each time it starts.
  reloadElapsed: number = 0;
  // The real reload duration for whichever weapon most recently started reloading here - carried
  // over from weaponState's reloadSeconds field (weapon-state-packet.handler.ts) so
  // weapon-reload-animation.system.ts can time a real frame-by-frame reload animation to span the
  // actual server-driven duration, not a guessed constant.
  reloadDurationSeconds: number = 0;

  // A one-shot "play the recoil/muzzle-flash animation" pulse, set true by
  // weapon-fired-packet.handler.ts the instant this hand's weaponFired broadcast arrives (server,
  // the exact moment a shot fires - not local input state, so this animates for every player's
  // shots, not just the local one). weapon-reload-animation.system.ts counts firingElapsed up and
  // flips this back to false once the weapon's own catalog.shootSeconds elapses - purely a client
  // visual duration, unrelated to the server's actual fire-rate cooldown. No-op for a weapon with
  // no shoot animation (e.g. smallGun) - see weapon-reload-animation.system.ts.
  firing: boolean = false;
  firingElapsed: number = 0;
}

// * Required to generate code
export default Weapon.name;
