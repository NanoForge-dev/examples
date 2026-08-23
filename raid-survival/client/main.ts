import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";

import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { ECSClientLibrary } from "@nanoforge-dev/ecs-client";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputEnum, InputLibrary } from "@nanoforge-dev/input";
import { MusicLibrary } from "@nanoforge-dev/music";
import { NetworkClientLibrary } from "@nanoforge-dev/network-client";
import { SoundLibrary } from "@nanoforge-dev/sound";
import { moveSystem } from "./systems/move.system";
import { spriteAnimator } from "./systems/renderable/sprite-animator.system";
import { spriteSystem } from "./systems/renderable/sprite.system";
import { cameraFollowSystem } from "./systems/camera-follow.system";
import { moveControl } from "./systems/move-control.client.system";
import { shootControl } from "./systems/packet-senders/shoot-control.client.system";
import { sendMoveControl } from "./systems/packet-senders/send-move-control.client.system";
import { sendShootControl } from "./systems/packet-senders/send-shoot-control.client.system";
import { packetHandler } from "./systems/packet-handler.system";
import {SceneManager} from "./scenes/SceneManager";
import {MenuScene} from "./scenes/MenuScene";
import {textareaSystem} from "./systems/renderable/textarea";
import { sceneSystem } from "./systems/scene";
import { sendLobbyAction } from "./systems/packet-senders/lobby-action";

export let clientConfig: {
  keybinds: {
    aimingMode: "mouse" | "arrows" | "joystick";
    shootMainWeapon: InputEnum;
    shootSecondWeapon: InputEnum;
    up: InputEnum;
    left: InputEnum;
    down: InputEnum;
    right: InputEnum;
  };
  login: string;
};

export let sceneManager: SceneManager;
export let playerId: number;

export function setPlayerId(id: number) {
  playerId = id;
}

export async function main(options: IRunOptions) {
  const app = NanoforgeFactory.createClient();

  const assetManagerLibrary = new AssetManagerLibrary();
  const ecsLibrary = new ECSClientLibrary();
  const graphicsLibrary = new Graphics2DLibrary();
  const inputLibrary = new InputLibrary();
  const musicLibrary = new MusicLibrary();
  const networkLibrary = new NetworkClientLibrary();
  const soundLibrary = new SoundLibrary();

  app.useAssetManager(assetManagerLibrary);
  app.useComponentSystem(ecsLibrary);
  app.useGraphics(graphicsLibrary);
  app.useInput(inputLibrary);
  app.use(Symbol("music"), musicLibrary);
  app.useNetwork(networkLibrary);
  app.useSound(soundLibrary);

  await app.init(options);

  const registry = ecsLibrary.registry;

  registry.addSystem(sceneSystem);
  registry.addSystem(moveControl);
  registry.addSystem(textareaSystem);
  registry.addSystem(shootControl);
  registry.addSystem(spriteAnimator);
  registry.addSystem(cameraFollowSystem);
  registry.addSystem(moveSystem);
  registry.addSystem(spriteSystem);

  registry.addSystem(packetHandler);

  registry.addSystem(sendMoveControl);
  registry.addSystem(sendShootControl);
  registry.addSystem(sendLobbyAction);

  async function waitForConnection(): Promise<void> {
    if (networkLibrary.tcp?.isConnected()) return;

    return new Promise((resolve) => {
      const check = () => {
        if (networkLibrary.tcp.isConnected()) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  await waitForConnection();

  sceneManager = new SceneManager(registry, graphicsLibrary.stage);
  sceneManager.switchTo(new MenuScene());

  await app.run();
}
