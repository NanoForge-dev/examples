/**
 * A sound the game plays by its `key` with `ctx.sound.play(key)`. Needs the `loadSounds` system.
 *
 * @component
 * @side client
 * @group Sound color=#36c5a0 - The sound and its name.
 */
export class SoundEffect {
  name = "SoundEffect";

  /** Whether `loadSounds` gave it to the sound library. */
  loaded = false;

  constructor(
    /** The name systems play it by. @group Sound */
    public key = "click",
    /** The sound file. @group Sound @asset .wav .mp3 .ogg */
    public path = "",
  ) {}
}
