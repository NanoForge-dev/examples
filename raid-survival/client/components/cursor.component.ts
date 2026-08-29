// Marker on the custom crosshair HUD sprite entity (built once per game - see launchGame in
// start-game-packet.handler.ts) - lets cursor.system.ts find it uniquely.
export class CursorComponent {
  name = this.constructor.name;
}

// * Required to generate code
export default CursorComponent.name;
