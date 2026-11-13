import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/server";
import type { ClientMessage, ClientMessageOf } from "@raid-survival/shared/protocol";

import { buildHandler } from "./build.handler";
import { buyAmmoHandler } from "./buy-ammo.handler";
import { buyWeaponHandler } from "./buy-weapon.handler";
import { destroyBuildingHandler } from "./destroy-building.handler";
import { equipWeaponHandler } from "./equip-weapon.handler";
import { inputHandler } from "./input.handler";
import { joinLobbyHandler } from "./join-lobby.handler";
import { startGameHandler } from "./start-game.handler";

type Handlers = {
  [T in ClientMessage["type"]]: (
    clientId: string,
    message: ClientMessageOf<T>,
    registry: Registry,
    ctx: Context,
  ) => void;
};

/** What the server does with each message a client sends, by its `type`. */
export const CLIENT_HANDLERS: Handlers = {
  input: inputHandler,
  joinLobby: joinLobbyHandler,
  startGame: startGameHandler,
  build: buildHandler,
  buyWeapon: buyWeaponHandler,
  buyAmmo: buyAmmoHandler,
  equipWeapon: equipWeaponHandler,
  destroyBuilding: destroyBuildingHandler,
};
