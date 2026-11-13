import { InputEnum } from "@nanoforge-dev/input";

/**
 * Turns the audio on and off with a key, and writes whether it is on in the entity's
 * `DrawableText2D`. Needs the system of the library it mutes: `muteSoundOnKey` or
 * `muteMusicOnKey`.
 *
 * @component
 * @side client
 */
export class MuteOnKey {
  name = "MuteOnKey";

  /** Whether the audio is off; the sound and music libraries start muted. Set by the system. */
  muted = true;
  /** Whether the key was down last frame, set by the system. */
  held = false;

  constructor(
    /** The key that turns the audio on and off. */
    public key: InputEnum = InputEnum.KeyM,
  ) {}
}
