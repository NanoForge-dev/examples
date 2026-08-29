import { Rect, Text } from "@nanoforge-dev/graphics-2d";

// Refs to the konva nodes built once at game start
// (client/systems/packet-handlers/start-game-packet.handler.ts) and mutated in place by
// wave-info-packet.handler.ts on every waveInfo packet - same "build once, patch node fields on
// update" pattern as HealthBarFill.
export class WaveHudComponent {
  name = this.constructor.name;

  constructor(
    public waveText: Text,
    public progressTrack: Rect,
    public progressFill: Rect,
    public aliveText: Text,
  ) {}
}

// * Required to generate code
export default WaveHudComponent.name;
