import { Rect, Text } from "@nanoforge-dev/graphics-2d";

/**
 * The wave HUD: the wave number, its progress, the zombies alive and the countdown to the next wave.
 *
 * @component
 * @side client
 */
export class WaveHudComponent {
  name = "WaveHudComponent";

  constructor(
    public waveText: Text,
    public progressTrack: Rect,
    public progressFill: Rect,
    public aliveText: Text,
    // Shown only during the "cooldown" phase between waves.
    public countdownText: Text,
  ) {}
}
