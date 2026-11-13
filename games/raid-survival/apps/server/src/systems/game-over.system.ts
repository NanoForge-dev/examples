import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";

import { GameState } from "../components/game-state.component";
import { gameState } from "../queries";
import { Health } from "../components/health.component";
import { Login } from "../components/login.component";
import { Lobby } from "../components/lobby.component";
import { WaveState } from "../components/wave-state.component";
import { Zombie } from "../components/zombie.component";
import { broadcast } from "../broadcast";

/**
 * Ends the game when the lobby or every player is dead (defeat), or the last wave has finished
 * spawning with nothing left alive (victory): broadcasts the final tally, then wipes every
 * entity. The game state switches away from `inGame` in the same tick, so this can't re-trigger later
 * for the same game.
 *
 * @system
 * @side server
 */
export const gameOverSystem = (registry: Registry, ctx: Context) => {
  if (gameState(registry)?.status !== "inGame") return;

  const lobbies: { Health: Health }[] = registry.getZipper([Lobby, Health]);
  const lobbyDead = lobbies.some((l) => l.Health.current <= 0);

  const players: { Health: Health }[] = registry.getZipper([Login, Health]);
  const allPlayersDead = players.length > 0 && players.every((p) => p.Health.current <= 0);

  // Sample everything needed for the tally/victory check up front - nothing after
  // clearEntities() below can read the registry any more.
  const waveStates: { WaveState: WaveState }[] = registry.getZipper([WaveState]);
  const waveState = waveStates[0]?.WaveState;
  const totalSpawned = waveState?.totalSpawned ?? 0;

  const zombies: { Health: Health }[] = registry.getZipper([Zombie, Health]);
  const aliveZombies = zombies.filter((z) => z.Health.current > 0).length;

  // totalSpawned > 0 guards against an empty/misconfigured waves file reading as an instant win.
  const allWavesCleared = waveState?.phase === "finished" && aliveZombies === 0 && totalSpawned > 0;

  if (!allWavesCleared && !lobbyDead && !allPlayersDead) return;
  broadcast(ctx, {
    type: "gameOver",
    // A photo finish (last zombie and last player/lobby health hitting 0 the same tick) counts as
    // a win, not a loss.
    result: allWavesCleared ? "victory" : "defeat",
    zombiesKilled: totalSpawned - aliveZombies,
  });

  // Every player entity goes too: the next game only has the players who join again.
  registry.clearEntities();
  registry.addComponent(registry.spawnEntity(), new GameState("endScreen"));
};
