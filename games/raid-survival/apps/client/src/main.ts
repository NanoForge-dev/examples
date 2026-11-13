import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputLibrary } from "@nanoforge-dev/input";
import { NetworkClientLibrary } from "@nanoforge-dev/network/client";
import { SceneLibrary } from "@nanoforge-dev/scene";

import "./scene-vars";
import { Game } from "./scenes/game.scene";
import { GameOver } from "./scenes/game-over.scene";
import { Menu } from "./scenes/menu.scene";
import { buildingInteractIndicatorSystem } from "./systems/building-interact-indicator.system";
import { buildModeSystem } from "./systems/build-mode.system";
import { cameraFollowSystem } from "./systems/camera-follow.system";
import { cursorSystem } from "./systems/cursor.system";
import { floatingTextSystem } from "./systems/floating-text.system";
import { lobbyActionSenders } from "./systems/lobby-action-senders.system";
import { sendMoveControl } from "./systems/move-control-sender.system";
import { moveControl } from "./systems/move-control.system";
import { moveSystem } from "./systems/move.system";
import { packetDispatch } from "./systems/packet-dispatch.system";
import { playerDeathSystem } from "./systems/player-death.system";
import { reloadIndicatorSystem } from "./systems/reload-indicator.system";
import { sendReviveControl } from "./systems/revive-control-sender.system";
import { reviveControlSystem } from "./systems/revive-control.system";
import { reviveHintIndicatorSystem } from "./systems/revive-hint-indicator.system";
import { reviveIndicatorSystem } from "./systems/revive-indicator.system";
import { rotateToDirectionSystem } from "./systems/rotate-to-direction.system";
import { sendShootControl } from "./systems/shoot-control-sender.system";
import { shootControl } from "./systems/shoot-control.system";
import { spriteAnimator } from "./systems/sprite-animator.system";
import { spriteSystem } from "./systems/sprite.system";
import { textareaSystem } from "./systems/textarea.system";
import { transformChildrenToParentSystem } from "./systems/transform-children-to-parent.system";
import { weaponReloadAnimationSystem } from "./systems/weapon-reload-animation.system";
import { weaponVisibilitySystem } from "./systems/weapon-visibility.system";
import { zOrderSystem } from "./systems/z-order.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  // The screens are laid out in window pixels, as in the original game: a design resolution of the
  // window's size at start keeps one game unit to one CSS pixel. shortcut: a resize letterboxes
  // instead of laying the screens out again; lay them out from ctx.viewport to handle it.
  const app = NanoforgeFactory.createClient({
    viewport: { width: window.innerWidth, height: window.innerHeight },
  });
  const ecs = new EcsLibrary();

  app.use(ecs);
  app.use(new Graphics2DLibrary());
  app.use(new InputLibrary());
  app.use(new NetworkClientLibrary());
  app.use(new SceneLibrary({ initial: Menu, scenes: { Menu, Game, GameOver } }));
  app.use(new EditorLibrary());

  await app.init(options);

  const registry = ecs.registry;

  registry.addSystem(moveControl);
  registry.addSystem(textareaSystem);
  registry.addSystem(shootControl);
  registry.addSystem(reviveControlSystem);
  // Must run before buildModeSystem/floatingTextSystem: those two re-assert their own raw Konva
  // nodes (no SpriteComponent, so zOrderSystem itself never manages them) to the top of the layer
  // every tick. Running zOrderSystem first means their "always on top" reassertion always has the
  // last word for the tick, instead of a same-tick sprite reorder winning the top spot back.
  registry.addSystem(zOrderSystem);
  registry.addSystem(buildModeSystem);
  registry.addSystem(playerDeathSystem);
  registry.addSystem(spriteAnimator);
  registry.addSystem(cameraFollowSystem);
  registry.addSystem(moveSystem);
  registry.addSystem(spriteSystem);
  registry.addSystem(transformChildrenToParentSystem);
  registry.addSystem(reloadIndicatorSystem);
  registry.addSystem(reviveIndicatorSystem);
  registry.addSystem(reviveHintIndicatorSystem);
  registry.addSystem(buildingInteractIndicatorSystem);
  registry.addSystem(weaponVisibilitySystem);
  registry.addSystem(cursorSystem);
  registry.addSystem(floatingTextSystem);
  // Before rotateToDirectionSystem, which must still consume the offset this sets.
  registry.addSystem(weaponReloadAnimationSystem);
  registry.addSystem(rotateToDirectionSystem);
  registry.addSystem(packetDispatch);
  registry.addSystem(sendMoveControl);
  registry.addSystem(sendShootControl);
  registry.addSystem(sendReviveControl);
  registry.addSystem(lobbyActionSenders);

  await app.run();
};
