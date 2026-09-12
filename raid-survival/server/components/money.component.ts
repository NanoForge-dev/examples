// Singleton - one entity holds this for the whole game (spawned alongside the lobby in
// start-game-packet.handler.ts). Shared across every player, not per-player: there's exactly
// one pool, read and written by zombie-death.system.ts.
export class Money {
  name = this.constructor.name;

  constructor(public amount: number) {}
}

// * Required to generate code
export default Money.name;
