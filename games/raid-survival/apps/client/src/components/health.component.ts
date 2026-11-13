/**
 * Health of an entity, as the server sent it.
 *
 * @component
 * @side client
 */
export class Health {
  name = "Health";

  constructor(
    /** Health left. */
    public current: number,
    /** Health at full. */
    public max: number,
  ) {}
}
