// Marker on the weapon child entity (parented to a player the same way the hand is - see
// buildPlayer in start-game-packet.handler.ts) - lets weapon-state-packet.handler.ts and
// weapon-reload-animation.system.ts find "this player's weapon sprite" via the same
// ChildrenComponent.parentId cross-reference pattern already used for health bars.
export class Weapon {
  name = this.constructor.name;

  // The DirectionRotatorComponent offset this weapon normally rotates with (aim-tracking) -
  // weapon-reload-animation.system.ts adds an oscillating delta on top of this while reloading,
  // then restores it exactly once done, rather than hardcoding the base offset in two places.
  constructor(public baseRotationOffset: number) {}

  reloading: boolean = false;
  // Local animation clock - only meaningful while reloading, reset each time it starts.
  reloadElapsed: number = 0;
}

// * Required to generate code
export default Weapon.name;
