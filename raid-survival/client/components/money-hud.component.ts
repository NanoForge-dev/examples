import { Text } from "@nanoforge-dev/graphics-2d";

// Ref to the konva Text node built once at game start
// (client/systems/packet-handlers/start-game-packet.handler.ts) and mutated in place by
// money-packet.handler.ts on every money packet - same pattern as WaveHudComponent.
export class MoneyHudComponent {
  name = this.constructor.name;

  constructor(public text: Text) {}
}

// * Required to generate code
export default MoneyHudComponent.name;
