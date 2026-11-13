import { InputEnum } from "@nanoforge-dev/input";

/**
 * The local player's keys: the `sendInput` system sends them to the server, which moves the
 * player's paddle.
 *
 * @component
 * @side client
 * @group Keys color=#f0a33a - The keys that move the paddle.
 */
export class PaddleInput {
  name = "PaddleInput";

  /** The paddle the server gave this player (`Seated`): 1, 2, or 0 while watching. */
  seat = 0;
  /** The last key sent to the server. */
  sent: "up" | "down" | "stop" = "stop";

  constructor(
    /** Moves the paddle up the field. @group Keys */
    public up: InputEnum = InputEnum.ArrowUp,
    /** Moves the paddle down the field. @group Keys */
    public down: InputEnum = InputEnum.ArrowDown,
    /** Swaps the keys for seat 2, whose camera faces the other way. @group Keys */
    public mirrored = false,
  ) {}
}
