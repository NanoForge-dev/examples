/**
 * The team's coins: one shared pool, not one per player.
 *
 * @component
 * @side server
 */
export class Money {
  name = "Money";

  constructor(
    /** Coins in the pool. */
    public amount = 0,
  ) {}
}
