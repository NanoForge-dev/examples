import type { Registry } from "@nanoforge-dev/ecs/server";

import { Client } from "./components/client.component";
import { GameState } from "./components/game-state.component";
import { Money } from "./components/money.component";

/** The server's state (one entity holds it). */
export const gameState = (registry: Registry): GameState | undefined =>
  (registry.getZipper([GameState]) as { GameState: GameState }[])[0]?.GameState;

/** Whether a game is running. */
export const inGame = (registry: Registry): boolean => gameState(registry)?.status === "inGame";

/** Every player of the lobby, by join order, with their entity id. */
export const lobbyClients = (registry: Registry): { id: number; Client: Client }[] =>
  registry.getIndexedZipper([Client]);

/** The player of a network session, with their entity id. */
export const clientOf = (
  registry: Registry,
  clientId: string,
): { id: number; Client: Client } | undefined =>
  lobbyClients(registry).find(({ Client: client }) => client.clientId === clientId);

/** The team's coin pool, while a game runs. */
export const teamMoney = (registry: Registry): Money | undefined =>
  (registry.getZipper([Money]) as { Money: Money }[])[0]?.Money;
