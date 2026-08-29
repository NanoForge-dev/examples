import { Text } from "@nanoforge-dev/graphics-2d";

// Ref to the konva Text node built once at game start
// (client/systems/packet-handlers/start-game-packet.handler.ts) and mutated in place by
// money-packet.handler.ts on every money packet - same pattern as WaveHudComponent. `amount` is
// tracked as a plain number too (not just baked into the display text) so other systems can read
// the current balance without parsing it back out - build-mode.system.ts needs it to know
// whether a placement is affordable.
export class MoneyHudComponent {
  name = this.constructor.name;

  constructor(
    public text: Text,
    public amount: number,
  ) {}
}

// * Required to generate code
export default MoneyHudComponent.name;
