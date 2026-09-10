import { Image, Rect, type Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import type { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import type { InputLibrary } from "@nanoforge-dev/input";
import type { ECSClientLibrary } from "@nanoforge-dev/ecs-client";
import { PositionComponent, VelocityComponent, BirdComponent } from "./components/bird.component";
import { PipeComponent } from "./components/pipe.component";
import { GameState } from "./game-state";
import { loadSprites, loadSounds } from "./assets";
import type { SoundManager } from "./sound-manager";
import { createInputSystem } from "./systems/input.system";
import { createPhysicsSystem, flap } from "./systems/physics.system";
import { createPipesSystem } from "./systems/pipes.system";
import { createCollisionSystem } from "./systems/collision.system";
import { createScoreSystem } from "./systems/score.system";
import { startRenderLoop } from "./render-loop";

const BIRD_X = 60;
const GROUND_HEIGHT = 112;
const RESTART_COOLDOWN_MS = 400;

export interface GameLibraries {
  graphics: Graphics2DLibrary;
  input: InputLibrary;
  sound: SoundManager;
  ecs: ECSClientLibrary;
  assetManager: AssetManagerLibrary;
}

export interface GameHandle {
  flap: () => void;
}

export async function registerGame(libs: GameLibraries): Promise<GameHandle> {
  const { graphics, input, sound, ecs, assetManager } = libs;
  const stage = graphics.stage;
  const layer = graphics.baseLayer;
  const stageWidth = stage.width();
  const stageHeight = stage.height();

  layer.listening(false);

  const [sprites] = await Promise.all([loadSprites(assetManager), loadSounds(assetManager, sound)]);

  const state = new GameState();

  const background = new Image({
    image: sprites.background,
    x: 0,
    y: 0,
    width: stageWidth,
    height: stageHeight,
  });
  layer.add(background);

  const ground = new Rect({
    x: 0,
    y: stageHeight - GROUND_HEIGHT,
    width: stageWidth,
    height: GROUND_HEIGHT,
    fillPatternImage: sprites.ground,
    fillPatternRepeat: "repeat-x",
  });
  layer.add(ground);

  const registry = ecs.registry;
  const bird = registry.spawnEntity();
  registry.addComponent(bird, new PositionComponent(BIRD_X, stageHeight / 2));
  registry.addComponent(bird, new VelocityComponent(0));
  registry.addComponent(bird, new BirdComponent());

  const birdFrameWidth = sprites.birdFrames[1]?.naturalWidth ?? 34;
  const birdFrameHeight = sprites.birdFrames[1]?.naturalHeight ?? 24;
  const birdNode = new Image({
    image: sprites.birdFrames[1],
    x: BIRD_X,
    y: stageHeight / 2,
    width: birdFrameWidth,
    height: birdFrameHeight,
    offsetX: birdFrameWidth / 2,
    offsetY: birdFrameHeight / 2,
  });
  layer.add(birdNode);

  state.lastTickAt = performance.now();
  state.prevBirdY = stageHeight / 2;
  state.currBirdY = stageHeight / 2;

  const message = new Image({
    image: sprites.message,
    x: (stageWidth - sprites.message.naturalWidth) / 2,
    y: stageHeight / 4,
    width: sprites.message.naturalWidth,
    height: sprites.message.naturalHeight,
  });
  layer.add(message);

  const pipeWidth = sprites.pipe.naturalWidth || 52;

  const scoreCtl = createScoreSystem({
    birdX: BIRD_X,
    pipeWidth,
    layer,
    digits: sprites.digits,
    stageWidth,
    sound,
    state,
  });

  let gameoverNode: Image | null = null;

  function handleGameOver(): void {
    gameoverNode = new Image({
      image: sprites.gameover,
      x: (stageWidth - sprites.gameover.naturalWidth) / 2,
      y: stageHeight / 3,
      width: sprites.gameover.naturalWidth,
      height: sprites.gameover.naturalHeight,
    });
    layer.add(gameoverNode);
    layer.batchDraw();
    state.gameOverAt = performance.now();
  }

  function resetGame(): void {
    const pipes = registry.getZipper([PipeComponent]) as { PipeComponent: PipeComponent }[];
    for (const { PipeComponent: pipe } of pipes) {
      pipe.topGroup.destroy();
      pipe.bottomGroup.destroy();
      registry.killEntity(pipe.entity);
    }
    state.pipeSpawnTimer = 0;
    state.pipesTick = [];

    gameoverNode?.destroy();
    gameoverNode = null;

    const pos = registry.getEntityComponent(bird, new PositionComponent(0, 0)) as PositionComponent;
    const vel = registry.getEntityComponent(bird, new VelocityComponent(0)) as VelocityComponent;
    pos.x = BIRD_X;
    pos.y = stageHeight / 2;
    vel.vy = 0;
    birdNode.x(BIRD_X);
    birdNode.y(stageHeight / 2);
    birdNode.rotation(0);

    state.prevBirdY = stageHeight / 2;
    state.currBirdY = stageHeight / 2;
    state.prevBirdRotation = 0;
    state.currBirdRotation = 0;

    state.score = 0;
    state.gameOver = false;
    scoreCtl.resetDisplay();
  }

  function handleFlap(): void {
    if (state.gameOver) {
      if (performance.now() - state.gameOverAt < RESTART_COOLDOWN_MS) return;
      resetGame();
      state.running = true;
      sound.play("swoosh");
      flap(registry, bird);
      sound.play("wing");
      return;
    }
    if (!state.running) {
      state.running = true;
      message.destroy();
      sound.play("swoosh");
    }
    flap(registry, bird);
    sound.play("wing");
  }

  registry.addSystem(createInputSystem(input, handleFlap));
  registry.addSystem(createPhysicsSystem(bird, birdNode, state));
  registry.addSystem(
    createPipesSystem({
      layer,
      pipeImage: sprites.pipe,
      stageWidth,
      stageHeight,
      groundHeight: GROUND_HEIGHT,
      ground,
      state,
    }),
  );
  registry.addSystem(
    createCollisionSystem({
      birdNode,
      groundY: stageHeight - GROUND_HEIGHT,
      sound,
      state,
      onGameOver: handleGameOver,
    }),
  );
  registry.addSystem(scoreCtl.tick);
  registry.addSystem(() => {
    state.lastTickAt = performance.now();
  });

  startRenderLoop({ layer, birdNode, ground, state });

  return { flap: handleFlap };
}
