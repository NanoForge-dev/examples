import type { Context } from "@nanoforge-dev/common";
import type { Registry, System } from "@nanoforge-dev/ecs-client";
import { Group, Image, type Layer, type Rect } from "@nanoforge-dev/graphics-2d";
import { PipeComponent } from "../components/pipe.component";
import type { GameState } from "../game-state";

const BASE_PIPE_GAP = 150;
const MIN_PIPE_GAP = 110;
const GAP_DIFFICULTY_STEP = 2.5;
const GAP_JITTER = 16;
const PIPE_SPEED = 150;
const SPAWN_INTERVAL = 1.5;
const CAP_HEIGHT = 24;
const EDGE_MARGIN = 60;
const MAX_DT = 1 / 30;

export interface PipesSystemDeps {
  layer: Layer;
  pipeImage: HTMLImageElement;
  stageWidth: number;
  stageHeight: number;
  groundHeight: number;
  ground: Rect;
  state: GameState;
}

function createPipeSegment(
  pipeImage: HTMLImageElement,
  pipeWidth: number,
  totalHeight: number,
  flipped: boolean,
): Group {
  const group = new Group();
  const bodyHeight = Math.max(0, totalHeight - CAP_HEIGHT);

  const body = new Image({
    image: pipeImage,
    crop: { x: 0, y: CAP_HEIGHT, width: pipeWidth, height: 320 - CAP_HEIGHT },
    x: 0,
    y: flipped ? 0 : CAP_HEIGHT,
    width: pipeWidth,
    height: bodyHeight,
  });
  const cap = new Image({
    image: pipeImage,
    crop: { x: 0, y: 0, width: pipeWidth, height: CAP_HEIGHT },
    x: 0,
    y: flipped ? bodyHeight : 0,
    width: pipeWidth,
    height: CAP_HEIGHT,
    scaleY: flipped ? -1 : 1,
    offsetY: flipped ? CAP_HEIGHT : 0,
  });
  group.add(body);
  group.add(cap);
  return group;
}

export function createPipesSystem(deps: PipesSystemDeps): System {
  const { layer, pipeImage, stageWidth, stageHeight, groundHeight, ground, state } = deps;
  const pipeWidth = pipeImage.naturalWidth || 52;
  const groundY = stageHeight - groundHeight;
  const playableHeight = groundY;

  return (registry: Registry, ctx: Context) => {
    const dt = Math.min(ctx.app.delta / 1000, MAX_DT);
    if (state.running) {
      state.prevGroundX = state.currGroundX;
      state.currGroundX -= PIPE_SPEED * dt;
    }
    if (!state.running || state.gameOver) {
      for (const { PipeComponent: pipe } of state.pipesTick) {
        pipe.prevX = pipe.x;
      }
      return;
    }

    state.pipeSpawnTimer -= dt;
    if (state.pipeSpawnTimer <= 0) {
      state.pipeSpawnTimer = SPAWN_INTERVAL;

      const difficultyGap = Math.max(
        MIN_PIPE_GAP,
        BASE_PIPE_GAP - state.score * GAP_DIFFICULTY_STEP,
      );
      const gap = Math.max(MIN_PIPE_GAP, difficultyGap + (Math.random() * 2 - 1) * GAP_JITTER);

      const centerMin = gap / 2 + EDGE_MARGIN;
      const centerMax = playableHeight - gap / 2 - EDGE_MARGIN;
      const gapCenterY = centerMin + Math.random() * Math.max(0, centerMax - centerMin);
      const topHeight = gapCenterY - gap / 2;
      const bottomHeight = groundY - (gapCenterY + gap / 2);

      const entity = registry.spawnEntity();
      const topGroup = createPipeSegment(pipeImage, pipeWidth, topHeight, true);
      topGroup.position({ x: stageWidth, y: 0 });
      const bottomGroup = createPipeSegment(pipeImage, pipeWidth, bottomHeight, false);
      bottomGroup.position({ x: stageWidth, y: gapCenterY + gap / 2 });

      layer.add(topGroup);
      layer.add(bottomGroup);
      ground.moveToTop();
      registry.addComponent(
        entity,
        new PipeComponent(
          entity,
          stageWidth,
          0,
          topHeight,
          pipeWidth,
          gapCenterY + gap / 2,
          bottomHeight,
          topGroup,
          bottomGroup,
        ),
      );
    }

    const pipes = registry.getZipper([PipeComponent]) as { PipeComponent: PipeComponent }[];

    const dead: PipeComponent[] = [];
    const alive: { PipeComponent: PipeComponent }[] = [];
    for (const row of pipes) {
      const pipe = row.PipeComponent;
      pipe.prevX = pipe.x;
      pipe.x -= PIPE_SPEED * dt;
      pipe.hitTop.x = pipe.x;
      pipe.hitBottom.x = pipe.x;
      if (pipe.x + pipeWidth < 0) {
        dead.push(pipe);
      } else {
        alive.push(row);
      }
    }
    for (const pipe of dead) {
      registry.killEntity(pipe.entity);
      pipe.topGroup.destroy();
      pipe.bottomGroup.destroy();
    }
    state.pipesTick = alive;
  };
}
