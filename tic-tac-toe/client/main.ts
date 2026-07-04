import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";

import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import {ECSClientLibrary, Registry} from "@nanoforge-dev/ecs-client";
import {Graphics2DLibrary, Layer} from "@nanoforge-dev/graphics-2d";
import { InputLibrary } from "@nanoforge-dev/input";
import { MusicLibrary } from "@nanoforge-dev/music";
import { SoundLibrary } from "@nanoforge-dev/sound";

import {Background, Board, Cell} from "./components/board.component";

import { cellSystem } from "./systems/board.system";
import {GameInfo} from "./components/game.component";
import {VictorySystem} from "./systems/game.component";
import {TurnText} from "./components/ui.component";
import {EndGameSystem} from "./systems/ui.component";

export const layer = new Layer();

export function initializeGame(registry: Registry) {
  const background = registry.spawnEntity();
  registry.addComponent(background, new Background(window.innerWidth, window.innerHeight));

  const boardSize = 500;
  createBoard(registry,
      window.innerWidth / 2 - boardSize / 2,
      window.innerHeight / 2 - boardSize / 2,
      boardSize
  );

  const TurnTextInfo = registry.spawnEntity();
  registry.addComponent(TurnTextInfo, new TurnText(
      window.innerWidth / 2,
      window.innerHeight / 2 - boardSize / 2 - 75))

  const gameInfo = registry.spawnEntity();
  registry.addComponent(gameInfo, new GameInfo());
}

function createBoard(registry: Registry, x: number, y: number, size: number) {
  const board = registry.spawnEntity();
  registry.addComponent(board, new Board(x, y, size));

  const padding = size * 0.1 / 4;
  const caseSize = (size - padding * 4) / 3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const newCell = registry.spawnEntity();
      registry.addComponent(newCell, new Cell(
          i, j,
          x + padding * (i + 1) + caseSize * i,
          y + padding * (j + 1) + caseSize * j,
          caseSize
      ));
    }
  }
}

export async function main(options: IRunOptions) {
  const app = NanoforgeFactory.createClient({ tickRate: 60});
  
  const assetManagerLibrary = new AssetManagerLibrary();
  const ecsLibrary = new ECSClientLibrary();
  const graphicsLibrary = new Graphics2DLibrary();
  const inputLibrary = new InputLibrary();
  const musicLibrary = new MusicLibrary();
  const soundLibrary = new SoundLibrary();
  
  app.useAssetManager(assetManagerLibrary);
  app.useComponentSystem(ecsLibrary);
  app.useGraphics(graphicsLibrary);
  app.useInput(inputLibrary);
  app.use(Symbol("music"), musicLibrary);
  app.useSound(soundLibrary);
  
  await app.init(options);
  
  const registry = ecsLibrary.registry;

  graphicsLibrary.stage.add(layer);

  initializeGame(registry);

  registry.addSystem(cellSystem);
  registry.addSystem(VictorySystem);
  registry.addSystem(EndGameSystem);
  
  await app.run();
}
