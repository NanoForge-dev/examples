import type { PipeComponent } from "./components/pipe.component";

type ZippedPipe = { PipeComponent: PipeComponent };

export class GameState {
  running = false;
  gameOver = false;
  score = 0;
  gameOverAt = 0;
  pipeSpawnTimer = 0;
  pipesTick: ZippedPipe[] = [];

  lastTickAt = 0;
  prevBirdY = 0;
  currBirdY = 0;
  prevBirdRotation = 0;
  currBirdRotation = 0;
  prevGroundX = 0;
  currGroundX = 0;
}
