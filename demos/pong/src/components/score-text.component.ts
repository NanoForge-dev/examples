/**
 * Shows the points of a player in its `DrawableText2D`. Needs the `showScores` system.
 *
 * @component
 * @side client
 */
export class ScoreText {
  name = "ScoreText";

  constructor(
    /** The player whose points are shown: the one a `Goal` gives them to. */
    public player = 1,
  ) {}
}
