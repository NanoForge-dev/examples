import type { Registry, System } from "@nanoforge-dev/ecs-client";
import type { Image as KonvaImage } from "@nanoforge-dev/graphics-2d";
import type { SoundManager } from "../sound-manager";
import type { GameState } from "../game-state";

type Rect = { x: number; y: number; width: number; height: number };

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

const BIRD_HITBOX_INSET_RATIO = 0.25;

function shrink(rect: Rect, ratio: number): Rect {
  const insetX = rect.width * ratio;
  const insetY = rect.height * ratio;
  return {
    x: rect.x + insetX,
    y: rect.y + insetY,
    width: rect.width - insetX * 2,
    height: rect.height - insetY * 2,
  };
}

export interface CollisionSystemDeps {
  birdNode: KonvaImage;
  groundY: number;
  sound: SoundManager;
  state: GameState;
  onGameOver: () => void;
}

export function createCollisionSystem(deps: CollisionSystemDeps): System {
  const { birdNode, groundY, sound, state, onGameOver } = deps;

  return (registry: Registry) => {
    if (!state.running || state.gameOver) return;
    void registry;

    const bird = shrink(
      {
        x: birdNode.x() - birdNode.width() / 2,
        y: state.currBirdY - birdNode.height() / 2,
        width: birdNode.width(),
        height: birdNode.height(),
      },
      BIRD_HITBOX_INSET_RATIO,
    );

    let hit = bird.y + bird.height >= groundY;
    if (!hit) {
      for (const { PipeComponent: pipe } of state.pipesTick) {
        if (overlaps(bird, pipe.hitTop) || overlaps(bird, pipe.hitBottom)) {
          hit = true;
          break;
        }
      }
    }

    if (hit) {
      state.gameOver = true;
      sound.play("hit");
      window.setTimeout(() => sound.play("die"), 150);
      onGameOver();
    }
  };
}
