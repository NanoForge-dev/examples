import type { ClientId } from "@nanoforge-dev/network/server";

/**
 * A paddle a client can play: the first clients to join take the free seats. Needs `Velocity2D`
 * and the `seatPlayers` and `steerPaddles` systems.
 *
 * @component
 * @side server
 */
export class Seat {
  name = "Seat";

  /** The client playing this paddle, until it leaves. */
  client: ClientId | undefined = undefined;

  constructor(
    /** The seat's number, sent to the client that takes it (1 left, 2 right). */
    public player = 1,
    /** In pixels per second. */
    public speed = 1000,
  ) {}
}
