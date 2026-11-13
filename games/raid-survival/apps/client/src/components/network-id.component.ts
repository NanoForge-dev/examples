/**
 * The id of the entity on the server, which the messages name.
 *
 * @component
 * @side client
 */
export class NetworkId {
  name = "NetworkId";

  constructor(
    /** Entity id on the server. */
    public id: number,
  ) {}
}
