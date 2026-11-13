export type WavePhase = "spawning" | "cooldown" | "finished";

/**
 * Singleton (spawned alongside the lobby) - owned entirely by zombie-wave system.
 *
 * @component
 * @side server
 */
export class WaveState {
  name = "WaveState";

  constructor(
    /** Entity id of the lobby the zombies walk to. */
    public lobbyEntityId = 0,
  ) {}

  waveIndex: number = 0;
  subWaveIndex: number = 0;
  phase: WavePhase = "spawning";
  // Seconds since the current sub-wave/cooldown phase started.
  timer: number = 0;
  // Total zombies spawned this game; game-over system uses it with the live alive-count to
  // report a kill tally.
  totalSpawned: number = 0;
  // Last whole-second countdown value broadcast during cooldown, so zombie-wave system only
  // re-sends on a visible change.
  lastCountdownSecond: number = -1;
}
