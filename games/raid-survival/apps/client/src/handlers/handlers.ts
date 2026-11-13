import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";
import type { ServerMessage, ServerMessageOf } from "@raid-survival/shared/protocol";

import { ammoHandler } from "./ammo.handler";
import { buildHandler } from "./build.handler";
import { directionHandler } from "./direction.handler";
import { gameOverHandler } from "./game-over.handler";
import { healHandler } from "./heal.handler";
import { hitHandler } from "./hit.handler";
import { joinLobbyHandler } from "./join-lobby.handler";
import { killHandler } from "./kill.handler";
import { lobbyInfoHandler } from "./lobby-info.handler";
import { lootHandler } from "./loot.handler";
import { moneyHandler } from "./money.handler";
import { moveHandler } from "./move.handler";
import { reviveHandler } from "./revive.handler";
import { shopRejectedHandler } from "./shop-rejected.handler";
import { spawnHandler } from "./spawn.handler";
import { startGameHandler } from "./start-game.handler";
import { towerUpdateHandler } from "./tower-update.handler";
import { waveInfoHandler } from "./wave-info.handler";
import { weaponFiredHandler } from "./weapon-fired.handler";
import { weaponInventoryHandler } from "./weapon-inventory.handler";
import { weaponStateHandler } from "./weapon-state.handler";
import { zombieStateHandler } from "./zombie-state.handler";

type Handlers = {
  [T in ServerMessage["type"]]: (
    message: ServerMessageOf<T>,
    registry: Registry,
    ctx: Context,
  ) => void;
};

/** What the client does with each message the server sends, by its `type`. */
export const SERVER_HANDLERS: Handlers = {
  joinLobby: (message, registry, ctx) => joinLobbyHandler(message, registry, ctx),
  lobbyInfo: (message, registry) => lobbyInfoHandler(message, registry),
  startGame: startGameHandler,
  spawn: (message, registry) => spawnHandler(message, registry),
  move: (message, registry) => moveHandler(message, registry),
  direction: (message, registry) => directionHandler(message, registry),
  kill: (message, registry) => killHandler(message, registry),
  hit: (message, registry) => hitHandler(message, registry),
  heal: (message, registry) => healHandler(message, registry),
  towerUpdate: (message, registry) => towerUpdateHandler(message, registry),
  zombieState: (message, registry) => zombieStateHandler(message, registry),
  waveInfo: (message, registry) => waveInfoHandler(message, registry),
  money: (message, registry) => moneyHandler(message, registry),
  loot: (message, registry) => lootHandler(message, registry),
  revive: (message, registry) => reviveHandler(message, registry),
  weaponState: (message, registry) => weaponStateHandler(message, registry),
  weaponFired: (message, registry) => weaponFiredHandler(message, registry),
  ammo: ammoHandler,
  weaponInventory: weaponInventoryHandler,
  build: (message) => buildHandler(message),
  buyWeapon: shopRejectedHandler,
  buyAmmo: shopRejectedHandler,
  equipWeapon: shopRejectedHandler,
  gameOver: (message, _registry, ctx) => gameOverHandler(message, ctx),
};
