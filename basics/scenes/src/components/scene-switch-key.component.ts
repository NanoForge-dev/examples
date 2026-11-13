import { InputEnum } from "@nanoforge-dev/input";

/**
 * Switches between the red and the blue room with a key. Needs the `switchSceneOnKey` system.
 *
 * @component
 * @side client
 */
export class SceneSwitchKey {
  name = "SceneSwitchKey";

  /** Whether the key was down last frame, set by `switchSceneOnKey`. */
  held = false;

  constructor(
    /** The key that switches rooms. */
    public key: InputEnum = InputEnum.Space,
  ) {}
}
