/**
 * A bullet in flight. `bulletSystem` stops it on a tree, the map edge or a zombie; `move2D` moves
 * it.
 *
 * @component
 * @side server
 */
export class Bullet {
  name = "Bullet";

  constructor(
    /** Damage dealt to the zombie it hits, set when fired so a weapon switch can't change it. */
    public damage = 1,
  ) {}
}
