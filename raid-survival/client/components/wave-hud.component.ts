import { Rect, Text } from "@nanoforge-dev/graphics-2d";

export class WaveHudComponent {
  name = this.constructor.name;

  constructor(
    public waveText: Text,
    public progressTrack: Rect,
    public progressFill: Rect,
    public aliveText: Text,
    // Shown only during the "cooldown" phase between waves.
    public countdownText: Text,
  ) {}
}

// * Required to generate code
export default WaveHudComponent.name;
