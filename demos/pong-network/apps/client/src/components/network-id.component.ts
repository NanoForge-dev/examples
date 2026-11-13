/**
 * The id of an entity on the network: the server and the clients spawn it with the same one, and
 * its `Move` packets carry it. The paddles have the id of their seat (1 and 2).
 *
 * @component
 * @side shared
 */
export class NetworkId {
  name = "NetworkId";

  /** The velocity last sent to the clients, by the server's `syncMoves`. NaN: to send again. */
  sentX = Number.NaN;
  /** See `sentX`. */
  sentY = Number.NaN;

  constructor(
    /** Same on the server and the clients. */
    public id = 0,
  ) {}
}
