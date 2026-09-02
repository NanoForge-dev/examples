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

// Ends the current game the moment the lobby or every player is dead: broadcasts the final
// tally, then wipes every entity so a fresh game can start from a clean slate. `gameStatus` is
// switched away from InGame in the same tick this fires, so this can never re-trigger on a later
// tick for the same game (registry.clearEntities() alone wouldn't be enough - every zipper-based
// system, including this one, would just see empty results and quietly no-op, not block a
// second broadcast).
export function gameOverSystem(registry: Registry, ctx: Context) {
  if (gameStatus.status !== GameStatusEnum.InGame) return;

  const lobbies: { Health: Health }[] = registry.getZipper([Lobby, Health]);
  const lobbyDead = lobbies.some((l) => l.Health.current <= 0);

  const players: { Health: Health }[] = registry.getZipper([Login, Health]);
  const allPlayersDead = players.length > 0 && players.every((p) => p.Health.current <= 0);

  if (!lobbyDead && !allPlayersDead) return;

  // Sample everything the "zombies killed" tally needs before clearing - nothing after this
  // point can read the registry.
  const waveStates: { WaveState: WaveState }[] = registry.getZipper([WaveState]);
  const totalSpawned = waveStates[0]?.WaveState.totalSpawned ?? 0;

  const zombies: { Health: Health }[] = registry.getZipper([Zombie, Health]);
  const aliveZombies = zombies.filter((z) => z.Health.current > 0).length;

  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  sendToInGamePlayers(network, {
    type: "gameOver",
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
