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

// Ends the current game the moment the lobby or every player is dead (defeat) OR the last wave
// has finished spawning and nothing's left alive to fight (victory): broadcasts the final tally,
// then wipes every entity so a fresh game can start from a clean slate. `gameStatus` is switched
// away from InGame in the same tick this fires, so this can never re-trigger on a later tick for
// the same game (registry.clearEntities() alone wouldn't be enough - every zipper-based system,
// including this one, would just see empty results and quietly no-op, not block a second
// broadcast).
export function gameOverSystem(registry: Registry, ctx: Context) {
  if (gameStatus.status !== GameStatusEnum.InGame) return;

  const lobbies: { Health: Health }[] = registry.getZipper([Lobby, Health]);
  const lobbyDead = lobbies.some((l) => l.Health.current <= 0);

  const players: { Health: Health }[] = registry.getZipper([Login, Health]);
  const allPlayersDead = players.length > 0 && players.every((p) => p.Health.current <= 0);

  // Sample everything the "zombies killed" tally (and the victory check) needs up front - nothing
  // after clearEntities() below can read the registry any more.
  const waveStates: { WaveState: WaveState }[] = registry.getZipper([WaveState]);
  const waveState = waveStates[0]?.WaveState;
  const totalSpawned = waveState?.totalSpawned ?? 0;

  const zombies: { Health: Health }[] = registry.getZipper([Zombie, Health]);
  const aliveZombies = zombies.filter((z) => z.Health.current > 0).length;

  // zombieWaveSystem flips WaveState to "finished" once every configured wave has been spawned
  // (registered before this system - server/main.ts - so this reads the current tick's phase, not
  // a stale one). totalSpawned > 0 guards against an empty/misconfigured waves file reading as an
  // instant win at tick zero, before anything ever spawned.
  const allWavesCleared = waveState?.phase === "finished" && aliveZombies === 0 && totalSpawned > 0;

  if (!allWavesCleared && !lobbyDead && !allPlayersDead) return;

  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  sendToInGamePlayers(network, {
    type: "gameOver",
    // A photo finish (last zombie and last player/lobby health going to 0 the same tick) reads as
    // a win, not a loss - the players did finish the fight, one tick's evaluation order shouldn't
    // cost them that.
    result: allWavesCleared ? "victory" : "defeat",
    // No system ever damages a zombie's own Health today (only players/the lobby take damage),
    // so this is always 0 until a player-vs-zombie combat system exists - at which point it
    // becomes correct for free, since it's just spawned-minus-still-alive.
    zombiesKilled: totalSpawned - aliveZombies,
  });

  // Not InGame any more, so join-lobby-packet.handler.ts's InGame gate no longer blocks
  // rejoining - EndScreen is purely an observability distinction, not a functional one.
  gameStatus.status = GameStatusEnum.EndScreen;
  registry.clearEntities();

  // Reset the lobby roster too, not just the entities - every entityId in `clients` is now
  // dangling (it pointed into the registry we just cleared), and every player is looking at
  // their own game-over screen, not the lobby. Emptying it means the next startGame only ever
  // spawns players who actually clicked Retry and rejoined through the normal flow (they'll get
  // a brand new entry with a fresh entityId, same as a first-time join - see
  // join-lobby-packet.handler.ts) - not a stale one that would otherwise collide with, or get
  // silently ignored in favor of, the freshly spawned entities of whoever rejoined. A player who
  // never retries simply isn't part of the next game, exactly like someone who never queued up.
  clients.length = 0;
}

// * Required to generate code
export default gameOverSystem.name;
