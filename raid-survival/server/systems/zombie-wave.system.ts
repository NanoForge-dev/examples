import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { WaveState } from "../components/wave-state.component";
import { Zombie } from "../components/zombie.component";
import { Health } from "../components/health.component";
import { spawnZombie } from "./packet-handlers/start-game-packet.handler";
import { sendToInGamePlayers } from "../network-utils";

// Time between sub-wave spawns, and between one wave finishing and the next starting.
const SUB_WAVE_INTERVAL_SECONDS = 3;
const WAVE_COOLDOWN_SECONDS = 20;

// Static assets ship flattened next to the built server bundle, not nested under "static/", so
// this resolves relative to this module's own runtime location rather than "../static/".
const WAVES_CONFIG_PATH = join(dirname(fileURLToPath(import.meta.url)), "zombie-waves.txt");

// One entry per wave (a line in the config file), each entry the zombie count of every sub-wave
// on that line, spawned SUB_WAVE_INTERVAL_SECONDS apart.
function loadZombieWaves(): number[][] {
  const raw = readFileSync(WAVES_CONFIG_PATH, "utf-8");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(/\s+/).map(Number));
}

const zombieWaves = loadZombieWaves();

export function zombieWaveSystem(registry: Registry, ctx: Context) {
  const entities: { WaveState: WaveState }[] = registry.getZipper([WaveState]);
  const state = entities[0]?.WaveState;
  if (!state || state.phase === "finished") return;

  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  const delta = ctx.app.delta / 1000;
  const wave = zombieWaves[state.waveIndex];
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
        spawnZombie(registry, network, state.lobbyEntityId);
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
      state.phase = state.waveIndex >= zombieWaves.length ? "finished" : "spawning";
      changed = true;
    }
  }

  if (changed) broadcastWaveInfo(network, registry, state);
}

function broadcastWaveInfo(network: NetworkServerLibrary, registry: Registry, state: WaveState) {
  const displayWaveIndex = Math.min(state.waveIndex, zombieWaves.length - 1);
  const wave = zombieWaves[displayWaveIndex] ?? [];

  sendToInGamePlayers(network, {
    type: "waveInfo",
    wave: displayWaveIndex + 1,
    maxWaves: zombieWaves.length,
    // Once finished, show the last wave's bar as full rather than frozen mid-progress.
    subWave: state.phase === "finished" ? wave.length : state.subWaveIndex,
    subWaveCount: wave.length,
    aliveZombies: countAliveZombies(registry),
    phase: state.phase,
    // Only meaningful while "cooldown" - hidden client-side otherwise.
    cooldownRemaining:
      state.phase === "cooldown" ? Math.max(0, Math.ceil(WAVE_COOLDOWN_SECONDS - state.timer)) : 0,
  });
}

function countAliveZombies(registry: Registry): number {
  const zombies: { Health: Health }[] = registry.getZipper([Zombie, Health]);
  return zombies.filter((z) => z.Health.current > 0).length;
}

// * Required to generate code
export default zombieWaveSystem.name;
