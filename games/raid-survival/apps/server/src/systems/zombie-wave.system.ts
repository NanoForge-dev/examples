import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";

import { broadcast } from "../broadcast";
import { Health } from "../components/health.component";
import { WaveState } from "../components/wave-state.component";
import { Zombie } from "../components/zombie.component";
import { spawnZombie } from "../spawn-zombie";
import { ZOMBIE_WAVES } from "../zombie-waves";

// Time between sub-wave spawns, and between one wave finishing and the next starting.
const SUB_WAVE_INTERVAL_SECONDS = 3;
const WAVE_COOLDOWN_SECONDS = 20;

/**
 * Runs the zombie waves of `ZOMBIE_WAVES` (`WaveState`): spawns each sub-wave at the trees, waits
 * for the wave to be cleared, then counts down to the next one, and tells the players.
 *
 * @system
 * @side server
 */
export const zombieWaveSystem = (registry: Registry, ctx: Context) => {
  const entities: { WaveState: WaveState }[] = registry.getZipper([WaveState]);
  const state = entities[0]?.WaveState;
  if (!state || state.phase === "finished") return;
  const delta = ctx.app.delta / 1000;
  const wave = ZOMBIE_WAVES[state.waveIndex];
  let changed = false;

  if (state.phase === "spawning") {
    const subWaveSize = wave?.[state.subWaveIndex];
    if (subWaveSize === undefined) {
      // No more sub-waves on this line (including an empty line) - straight to cooldown.
      state.phase = "cooldown";
      state.timer = 0;
      changed = true;
    } else if (state.subWaveIndex === 0 || state.timer >= SUB_WAVE_INTERVAL_SECONDS) {
      // subWaveIndex 0 fires immediately on entering the wave - the interval only separates
      // sub-waves from each other.
      for (let i = 0; i < subWaveSize; i++) {
        spawnZombie(ctx, state.lobbyEntityId);
      }
      state.totalSpawned += subWaveSize;
      state.subWaveIndex += 1;
      state.timer = 0;
      changed = true;
    } else {
      state.timer += delta;
    }
  } else {
    state.timer += delta;

    // Re-broadcast whenever the displayed whole-second countdown ticks down, not every tick.
    const remainingSecond = Math.max(0, Math.ceil(WAVE_COOLDOWN_SECONDS - state.timer));
    if (remainingSecond !== state.lastCountdownSecond) {
      state.lastCountdownSecond = remainingSecond;
      changed = true;
    }

    if (state.timer >= WAVE_COOLDOWN_SECONDS) {
      state.waveIndex += 1;
      state.subWaveIndex = 0;
      state.timer = 0;
      state.phase = state.waveIndex >= ZOMBIE_WAVES.length ? "finished" : "spawning";
      changed = true;
    }
  }

  if (changed) broadcastWaveInfo(ctx, state);
};

const broadcastWaveInfo = (ctx: Context, state: WaveState) => {
  const displayWaveIndex = Math.min(state.waveIndex, ZOMBIE_WAVES.length - 1);
  const wave = ZOMBIE_WAVES[displayWaveIndex] ?? [];

  broadcast(ctx, {
    type: "waveInfo",
    wave: displayWaveIndex + 1,
    maxWaves: ZOMBIE_WAVES.length,
    // Once finished, show the last wave's bar as full rather than frozen mid-progress.
    subWave: state.phase === "finished" ? wave.length : state.subWaveIndex,
    subWaveCount: wave.length,
    aliveZombies: countAliveZombies(ctx.ecs.registry),
    phase: state.phase,
    // Only meaningful while "cooldown" - hidden client-side otherwise.
    cooldownRemaining:
      state.phase === "cooldown" ? Math.max(0, Math.ceil(WAVE_COOLDOWN_SECONDS - state.timer)) : 0,
  });
};

const countAliveZombies = (registry: Registry): number => {
  const zombies: { Health: Health }[] = registry.getZipper([Zombie, Health]);
  return zombies.filter((z) => z.Health.current > 0).length;
};
