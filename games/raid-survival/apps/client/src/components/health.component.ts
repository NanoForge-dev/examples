/**
 * Health of an entity, as the server sent it.
 *
 * @component
 * @side client
 */
export class Health {
  name = "Health";

  constructor(
    public current: number,
    public max: number,
  ) {}
}
