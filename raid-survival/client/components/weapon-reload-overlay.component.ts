// Marker on a player's reload-animation overlay sprite entity (built once alongside the weapon in
// buildHandAndWeapon, start-game-packet.handler.ts, only for weapon types with a catalog
// reloadSpriteKey - currently just the shotgun). One weapon per player now (dual wielding
// removed), so this needs no disambiguating field - weapon-reload-animation.system.ts finds it
// via ChildrenComponent.parentId alone.
export class WeaponReloadOverlayComponent {
  name = this.constructor.name;
}

// * Required to generate code
export default WeaponReloadOverlayComponent.name;
