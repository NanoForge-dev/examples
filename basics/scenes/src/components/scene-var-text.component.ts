/**
 * Writes the value of a scene var in the entity's `DrawableText2D`. Needs the `showSceneVar`
 * system.
 *
 * @component
 * @side client
 * @group Text color=#e86fb0 - What is written.
 */
export class SceneVarText {
  name = "SceneVarText";

  constructor(
    /** The key of the var in `ctx.scenes.vars`. @group Text */
    public variable = "",
    /** Written before the value. @group Text */
    public label = "",
  ) {}
}
