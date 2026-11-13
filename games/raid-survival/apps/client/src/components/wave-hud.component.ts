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
    /** The "Wave n/m" text. */
    public waveText: Text,
    /** The track of the wave progress bar. */
    public progressTrack: Rect,
    /** The fill of the wave progress bar. */
    public progressFill: Rect,
    /** The zombies alive. */
    public aliveText: Text,
    // Shown only during the "cooldown" phase between waves.
    /** The countdown to the next wave. */
    public countdownText: Text,
  ) {}
}
