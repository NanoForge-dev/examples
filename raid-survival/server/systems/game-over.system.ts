import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";

import { clients, gameStatus, GameStatusEnum } from "../main";
import { Health } from "../components/health.component";
import { Login } from "../components/login.component";
import { Lobby } from "../components/lobby.component";
import { WaveState } from "../components/wave-state.component";
import { Zombie } from "../components/zombie.component";
import { sendToInGamePlayers } from "../network-utils";

// Ends the game when the lobby or every player is dead (defeat), or the last wave has finished
// spawning with nothing left alive (victory): broadcasts the final tally, then wipes every
// entity. `gameStatus` switches away from InGame in the same tick, so this can't re-trigger later
// for the same game.
export function gameOverSystem(registry: Registry, ctx: Context) {
  if (gameStatus.status !== GameStatusEnum.InGame) return;

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

  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  sendToInGamePlayers(network, {
    type: "gameOver",
    // A photo finish (last zombie and last player/lobby health hitting 0 the same tick) counts as
    // a win, not a loss.
    result: allWavesCleared ? "victory" : "defeat",
    zombiesKilled: totalSpawned - aliveZombies,
  });

  gameStatus.status = GameStatusEnum.EndScreen;
  registry.clearEntities();

  // Every entityId in `clients` is now dangling (it pointed into the registry we just cleared).
  // Emptying it means the next startGame only spawns players who rejoin through the normal flow
  // with a fresh entityId - a player who never retries just isn't part of the next game.
  clients.length = 0;
}

// * Required to generate code
export default gameOverSystem.name;
