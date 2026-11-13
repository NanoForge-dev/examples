/**
 * How the pipes come: how fast, how often, and how wide their gap is. The `movePipes` system
 * takes a pair of `Pipe` entities that left the screen and brings it back on the right.
 *
 * @remarks
 * The gap shrinks by `gapStep` for every point, down to `minGap`, give or take `gapJitter`.
 *
 * @component
 * @side client
 * @group Flow color=#36c5a0 - How fast and how often the pipes come.
 * @group Gap color=#f0a33a - The opening between two pipes.
 */
export class PipeSpawner {
  name = "PipeSpawner";

  /** Seconds left before the next pair comes. */
  timer = 0;

  constructor(
    /** Pixels per second to the left. @group Flow */
    public speed = 150,
    /** Seconds between two pairs. @group Flow */
    public interval = 1.5,
    /** Where a pair comes in, in pixels from the left (the right edge of the screen). @group Flow */
    public startX = 420,
    /** Height of the gap at the start, in pixels. @group Gap */
    public baseGap = 150,
    /** The smallest gap, in pixels. @group Gap */
    public minGap = 110,
    /** Pixels the gap loses for every point. @group Gap */
    public gapStep = 2.5,
    /** Random pixels added to or taken from the gap. @group Gap */
    public gapJitter = 16,
    /** The least room between the gap and the sky or the ground, in pixels. @group Gap */
    public margin = 60,
    /** Pixels from the top of the screen to the ground. @group Gap */
    public groundY = 448,
  ) {}
}
