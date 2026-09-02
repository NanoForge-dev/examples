// Marker on a "RELOAD!" HUD sprite entity (built once alongside each hand's ammo HUD row - see
// buildAmmoHud in start-game-packet.handler.ts) - lets reload-indicator.system.ts find the right
// one of a player's two (one per hand) without mixing them up.
export class ReloadIndicatorComponent {
  name = this.constructor.name;

  constructor(public hand: "left" | "right") {}
}

// * Required to generate code
export default ReloadIndicatorComponent.name;
