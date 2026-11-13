import type { SceneVarKey } from "@nanoforge-dev/scene";

/**
 * Shows a scene var in the entity's `DrawableText2D`: its text becomes `template`, with `{}`
 * replaced by the var's value, or by `-` while the var does not exist. Needs the `showSceneVar`
 * system.
 *
 * @example
 * `new SceneVarText("score", "Score {}")` shows "Score 120" while `score` is 120.
 *
 * @component
 * @side client
 * @group Text color=#e86fb0 - What is shown.
 */
export class SceneVarText {
  name = "SceneVarText";

  constructor(
    /** The key of the var in `ctx.scenes.vars`. @group Text */
    public variable: SceneVarKey = "",
    /** The text, where `{}` is the var's value. @group Text */
    public template = "{}",
  ) {}
}
