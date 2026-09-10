import { NanoforgeFactory } from "@nanoforge-dev/core";
import { type IRunClientOptions, type IRunOptions } from "@nanoforge-dev/common";
import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputLibrary } from "@nanoforge-dev/input";
import { ECSClientLibrary } from "@nanoforge-dev/ecs-client";

import { registerGame } from "./game";
import { SoundManager } from "./sound-manager";

const GAME_WIDTH = 420;
const GAME_HEIGHT = 560;

export async function main(options: IRunOptions) {
  const { container } = options as IRunClientOptions;

  const client = NanoforgeFactory.createClient({ tickRate: 60 });
  const assetManager = new AssetManagerLibrary();
  const graphics = new Graphics2DLibrary();
  const input = new InputLibrary();
  const ecs = new ECSClientLibrary();
  const sound = new SoundManager();

  client.useAssetManager(assetManager);
  client.useGraphics(graphics);
  client.useInput(input);
  client.useComponentSystem(ecs);

  await client.init(options);

  const stage = graphics.stage;
  stage.size({ width: GAME_WIDTH, height: GAME_HEIGHT });

  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  const canvas = container.querySelector("canvas");

  function applyResponsiveScale(): void {
    const scale = Math.min(
      container.clientWidth / GAME_WIDTH,
      container.clientHeight / GAME_HEIGHT,
    );
    if (canvas) {
      canvas.style.transform = `scale(${scale > 0 ? scale : 1})`;
    }
  }

  applyResponsiveScale();
  requestAnimationFrame(applyResponsiveScale);
  window.addEventListener("resize", applyResponsiveScale);

  const game = await registerGame({ graphics, input, sound, ecs, assetManager });
  await client.run();

  container.addEventListener(
    "touchstart",
    (event) => {
      event.preventDefault();
      game.flap();
    },
    { passive: false },
  );
}
