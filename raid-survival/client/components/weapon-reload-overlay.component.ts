// Marker on a hand's reload-animation overlay sprite entity (built once alongside the hand+weapon
// in buildHandAndWeapon, start-game-packet.handler.ts, only for weapon types with a catalog
// reloadSpriteKey - currently just the shotgun) - lets weapon-reload-animation.system.ts find the
// right one of a player's two (one per hand) without mixing them up, the same pattern
// ReloadIndicatorComponent already uses for the "RELOAD!" HUD sprite.
export class WeaponReloadOverlayComponent {
  name = this.constructor.name;

  constructor(public hand: "left" | "right") {}
}

// * Required to generate code
export default WeaponReloadOverlayComponent.name;
