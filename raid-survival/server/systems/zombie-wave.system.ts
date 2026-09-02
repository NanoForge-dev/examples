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

// How long a wave waits between spawning each of its numbers, and how long the game waits
// between one wave finishing and the next starting - the numbers most likely to need tuning
// alongside the wave counts themselves (server/static/zombie-waves.txt).
const SUB_WAVE_INTERVAL_SECONDS = 3;
const WAVE_COOLDOWN_SECONDS = 10;

// Static assets ship flattened next to the built server bundle - everything under
// server/static/ lands directly beside main.js at runtime, not nested under a "static/" folder
// (verified via `nf build` - server/static/map-collision.json ends up at .nanoforge/server/
// map-collision.json). So this has to resolve relative to this module's own runtime location,
// not by mirroring the source tree's "../static/" path.
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

// Generic-looking but only ever matches the single WaveState singleton spawned alongside the
// lobby in start-game-packet.handler.ts.
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
      // subWaveIndex 0 always fires immediately on entering the wave - the interval only
      // separates sub-waves from each other, not the wave's start from its first sub-wave.
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
  });
}

function countAliveZombies(registry: Registry): number {
  const zombies: { Health: Health }[] = registry.getZipper([Zombie, Health]);
  return zombies.filter((z) => z.Health.current > 0).length;
}

// * Required to generate code
export default zombieWaveSystem.name;
