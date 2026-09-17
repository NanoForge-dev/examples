// Singleton shared money pool (spawned in start-game-packet.handler.ts) - not per-player.
export class Money {
  name = this.constructor.name;

  constructor(public amount: number) {}
}

// * Required to generate code
export default Money.name;
