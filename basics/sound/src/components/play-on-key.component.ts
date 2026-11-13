import { InputEnum } from "@nanoforge-dev/input";

/**
 * Plays an audio asset each time a key is pressed. Needs the system of the library that plays it:
 * `playSoundOnKey` (the sound library: effects that may overlap) or `playMusicOnKey` (the music
 * library: one track at a time).
 *
 * @remarks
 * Both libraries start muted: add a `MuteOnKey` to let the player turn them on.
 *
 * @component
 * @side client
 * @group Audio color=#f0a33a - What is played, and when.
 */
export class PlayOnKey {
  name = "PlayOnKey";

  /** Whether the key was down last frame, set by the system. */
  held = false;
  /** Whether `file` was handed to the library, or is not an asset. Set by the system. */
  status?: "loaded" | "missing";

  constructor(
    /** The key that plays it. @group Audio */
    public key: InputEnum = InputEnum.Space,
    /** The audio file. @group Audio @asset .wav .mp3 .ogg */
    public file = "",
  ) {}
}
