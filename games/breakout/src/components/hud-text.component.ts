/**
 * Shows a scene var in its `DrawableText2D`. Needs the `updateHud` system.
 *
 * @component
 * @side client
 */
export class HudText {
  name = "HudText";

  constructor(
    /** The var shown: `score`, `lives`, `level` or `best`. */
    public show: "score" | "lives" | "level" | "best" = "score",
  ) {}
}
