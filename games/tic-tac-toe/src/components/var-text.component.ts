import type { SceneVarKey } from "@nanoforge-dev/scene";

/**
 * Shows a scene var in a `DrawableText2D`: its text becomes `template`, with `{}` replaced by the
 * var's value. Needs the `varText` system.
 *
 * @example
 * `new VarText("player", "Player {}'s turn")` shows "Player 2's turn" while `player` is 2.
 *
 * @component
 * @side client
 * @group Text color=#e86fb0 - What is shown.
 */
export class VarText {
  name = "VarText";

  constructor(
    /** The scene var to show. @group Text */
    public key: SceneVarKey = "player",
    /** The text, where `{}` is the var's value. @group Text */
    public template = "{}",
  ) {}
}
