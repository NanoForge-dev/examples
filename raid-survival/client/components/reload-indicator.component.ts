// Marker on the "RELOAD!" HUD sprite entity (built once alongside the ammo HUD - see
// buildAmmoHud in start-game-packet.handler.ts) - lets reload-indicator.system.ts find it without
// mixing it up with any other SpriteComponent on screen.
export class ReloadIndicatorComponent {
  name = this.constructor.name;
}

// * Required to generate code
export default ReloadIndicatorComponent.name;
