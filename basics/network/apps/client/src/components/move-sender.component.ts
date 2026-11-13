import { InputEnum } from "@nanoforge-dev/input";

/**
 * Sends the server where the player wants to go, from the keys held down; the server moves the
 * player. Needs the `sendMoves` system.
 *
 * @component
 * @side client
 * @group Keys color=#f0a33a - The keys that move the player.
 */
export class MoveSender {
  name = "MoveSender";

  /** Whether the client asked the server for a player, set by `sendMoves`. */
  joined = false;
  /** The direction last sent, set by `sendMoves`. */
  sentX = 0;
  /** The direction last sent, set by `sendMoves`. */
  sentY = 0;

  constructor(
    /** @group Keys */
    public left: InputEnum = InputEnum.ArrowLeft,
    /** @group Keys */
    public right: InputEnum = InputEnum.ArrowRight,
    /** @group Keys */
    public up: InputEnum = InputEnum.ArrowUp,
    /** @group Keys */
    public down: InputEnum = InputEnum.ArrowDown,
  ) {}
}
