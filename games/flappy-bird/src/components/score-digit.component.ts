/**
 * One digit of the score, drawn with the digit images (`/0.png` to `/9.png`). Needs
 * `Position2D`, `DrawableRect2D` and the `showScore` system.
 *
 * @remarks
 * `showScore` centers the digits, and hides the ones the score doesn't need.
 *
 * @component
 * @side client
 * @group Digit color=#f9ca24 - Which digit it shows.
 */
export class ScoreDigit {
  name = "ScoreDigit";

  constructor(
    /** Its place from the left: 0 is the first digit. @group Digit */
    public index = 0,
    /** Where the score is centered, in pixels from the left. @group Digit */
    public centerX = 210,
  ) {}
}
