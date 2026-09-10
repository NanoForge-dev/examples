import type { Image, Layer, Rect } from "@nanoforge-dev/graphics-2d";
import type { GameState } from "./game-state";

// Must match NanoforgeFactory.createClient({ tickRate: 60 }) in main.ts.
const TICK_INTERVAL_MS = 1000 / 60;

function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}

export interface RenderLoopDeps {
  layer: Layer;
  birdNode: Image;
  ground: Rect;
  state: GameState;
}

export function startRenderLoop(deps: RenderLoopDeps): void {
  const { layer, birdNode, ground, state } = deps;

  function render(): void {
    try {
      const alpha = Math.min(1, (performance.now() - state.lastTickAt) / TICK_INTERVAL_MS);

      birdNode.y(lerp(state.prevBirdY, state.currBirdY, alpha));
      birdNode.rotation(lerp(state.prevBirdRotation, state.currBirdRotation, alpha));
      ground.fillPatternX(lerp(state.prevGroundX, state.currGroundX, alpha));

      for (const { PipeComponent: pipe } of state.pipesTick) {
        const x = lerp(pipe.prevX, pipe.x, alpha);
        pipe.topGroup.x(x);
        pipe.bottomGroup.x(x);
      }

      layer.batchDraw();
    } catch (err) {
      console.error("render-loop: skipping frame after error", err);
    }
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
