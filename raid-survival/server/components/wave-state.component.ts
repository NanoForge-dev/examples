export type WavePhase = "spawning" | "cooldown" | "finished";

// Singleton - one entity holds this for the whole game (spawned alongside the lobby in
// start-game-packet.handler.ts). Drives and is driven entirely by zombie-wave.system.ts.
export class WaveState {
  name = this.constructor.name;

  constructor(public lobbyEntityId: number) {}

  waveIndex: number = 0;
  subWaveIndex: number = 0;
  phase: WavePhase = "spawning";
  // Seconds since the current sub-wave/cooldown started - reset to 0 on every spawn and on every
  // phase transition.
  timer: number = 0;
  // Running total of zombies spawned this game - read by game-over.system.ts (alongside a live
  // alive-zombie count) to derive a "zombies killed" tally, since nothing kills a zombie's own
  // Health component directly today.
  totalSpawned: number = 0;
}

// * Required to generate code
export default WaveState.name;
