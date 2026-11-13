/**
 * The id of an entity on the network: the server and the clients know the entity by it, and the
 * messages about the entity carry it.
 *
 * @component
 * @side shared
 */
export class NetworkId {
  name = "NetworkId";

  /** The velocity last sent to the clients (by pong's `syncMoves`). NaN: to send again. */
  sentX = Number.NaN;
  /** See `sentX`. */
  sentY = Number.NaN;

  constructor(
    /** Same on the server and the clients. */
    public id = 0,
  ) {}
}
