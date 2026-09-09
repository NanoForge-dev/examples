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
import { playerDeathSystem } from "./systems/player-death.system";
import { spriteSystem } from "./systems/renderable/sprite.system";
import { cameraFollowSystem } from "./systems/camera-follow.system";
import { moveControl } from "./systems/move-control.system";
import { shootControl } from "./systems/shoot-control.system";
import { reviveControlSystem } from "./systems/revive-control.system";
import { buildModeSystem } from "./systems/build-mode.system";
import { sendMoveControl } from "./systems/packet-senders/move-control.senders.system";
import { sendShootControl } from "./systems/packet-senders/shoot-control.sender.system";
import { sendReviveControl } from "./systems/packet-senders/revive-control.sender.system";
import { packetHandler } from "./systems/packet-handler.system";
import { SceneManager } from "./scenes/SceneManager";
import { MenuScene } from "./scenes/MenuScene";
import { textareaSystem } from "./systems/renderable/textarea";
import { sceneSystem } from "./systems/scene";
import { lobbyActionSenders } from "./systems/packet-senders/lobby-action.senders";
import { transformChildrenToParentSystem } from "./systems/transform-children-to-parent.system";
import { rotateToDirectionSystem } from "./systems/rotate-to-direction.system";
import { weaponReloadAnimationSystem } from "./systems/weapon-reload-animation.system";
import { reloadIndicatorSystem } from "./systems/reload-indicator.system";
import { reviveIndicatorSystem } from "./systems/revive-indicator.system";
import { reviveHintIndicatorSystem } from "./systems/revive-hint-indicator.system";
import { buildingInteractIndicatorSystem } from "./systems/building-interact-indicator.system";
import { weaponVisibilitySystem } from "./systems/weapon-visibility.system";
import { cursorSystem } from "./systems/cursor.system";
import { floatingTextSystem } from "./systems/floating-text.system";
import { zOrderSystem } from "./systems/essentials/z-order.system";

// The engine's own per-tick system runner (@nanoforge-dev/ecs-lib's WASM Registry.run_systems,
// invoked from @nanoforge-dev/core's Core.runExecute) has no try/catch anywhere in the chain - an
// uncaught exception in ANY one system silently aborts that tick's run_systems call entirely,
// taking every system registered AFTER it down with it (they simply never run again, forever,
// with no visible error), and can stop the engine's own re-scheduling of the next tick outright.
// Wrapping every system in this before it ever reaches registry.addSystem means one system's bug
// can only ever break that system - not everything registered after it - and any exception (now
// or in the future) gets logged with the system's name instead of vanishing silently.
function safeSystem<Fn extends (...args: never[]) => unknown>(system: Fn): Fn {
  return ((...args: never[]) => {
    try {
      system(...args);
    } catch (err) {
      console.error(`[system:${system.name}]`, err);
    }
  }) as Fn;
}

export let clientConfig: {
  keybinds: {
    aimingMode: "mouse" | "arrows" | "joystick";
    shoot: InputEnum;
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

  registry.addSystem(safeSystem(sceneSystem));
  registry.addSystem(safeSystem(moveControl));
  registry.addSystem(safeSystem(textareaSystem));
  registry.addSystem(safeSystem(shootControl));
  registry.addSystem(safeSystem(reviveControlSystem));
  // Before buildModeSystem/floatingTextSystem (both below): those two re-assert their own raw
  // Konva nodes (build grid/preview rect/bar icons, floating damage text - none carry a
  // SpriteComponent, so zOrderSystem itself never manages them) to the very top of the layer
  // every tick they're visible. zOrderSystem re-sorts and re-stacks every ZIndexComponent+
  // SpriteComponent entity (buildings, zombies, bullets, ...) whenever that set's order changes
  // - which happens constantly during play (a bullet spawning/dying is enough). With zOrderSystem
  // registered LAST (its old position, after floatingTextSystem), any such reorder on a given
  // tick would win the layer's top spot back out from under the build grid/floating text placed
  // there earlier THAT SAME tick, and the next tick's re-assertion would put it back on top again
  // - a same-tick top-spot race that reads as the build grid blinking/flickering under buildings.
  // Running zOrderSystem first instead means the "always on top" re-assertions below always have
  // the last word for the tick, every tick, not just on however many ticks zOrderSystem happens
  // not to reorder anything. The only cost is a brand-new sprite (spriteSystem, below, creates the
  // underlying Konva node lazily) not being folded into zOrderSystem's own stacking until the
  // following tick instead of the same one - a one-frame, self-correcting, imperceptible delay.
  registry.addSystem(safeSystem(zOrderSystem));
  registry.addSystem(safeSystem(buildModeSystem));
  registry.addSystem(safeSystem(playerDeathSystem));
  registry.addSystem(safeSystem(spriteAnimator));
  registry.addSystem(safeSystem(cameraFollowSystem));
  registry.addSystem(safeSystem(moveSystem));
  registry.addSystem(safeSystem(spriteSystem));
  registry.addSystem(safeSystem(transformChildrenToParentSystem));
  registry.addSystem(safeSystem(reloadIndicatorSystem));
  registry.addSystem(safeSystem(reviveIndicatorSystem));
  registry.addSystem(safeSystem(reviveHintIndicatorSystem));
  registry.addSystem(safeSystem(buildingInteractIndicatorSystem));
  registry.addSystem(safeSystem(weaponVisibilitySystem));
  registry.addSystem(safeSystem(cursorSystem));
  registry.addSystem(safeSystem(floatingTextSystem));
  // After buildModeSystem/weaponVisibilitySystem (above), before rotateToDirectionSystem (below) -
  // it forces the main weapon sprite hidden while a dedicated reload animation overlay is playing
  // instead, and that write needs to be the last one standing for the tick; it also sets
  // DirectionRotatorComponent.offset, which rotateToDirectionSystem must still consume afterward.
  registry.addSystem(safeSystem(weaponReloadAnimationSystem));
  registry.addSystem(safeSystem(rotateToDirectionSystem));

  registry.addSystem(safeSystem(packetHandler));

  registry.addSystem(safeSystem(sendMoveControl));
  registry.addSystem(safeSystem(sendShootControl));
  registry.addSystem(safeSystem(sendReviveControl));
  registry.addSystem(safeSystem(lobbyActionSenders));

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
