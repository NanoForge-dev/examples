import type { Registry, System } from "@nanoforge-dev/ecs-client";
import { Group, Image, type Layer } from "@nanoforge-dev/graphics-2d";
import type { SoundManager } from "../sound-manager";
import type { GameState } from "../game-state";

export interface ScoreSystemDeps {
  birdX: number;
  pipeWidth: number;
  layer: Layer;
  digits: HTMLImageElement[];
  stageWidth: number;
  sound: SoundManager;
  state: GameState;
}

function renderScore(deps: ScoreSystemDeps, group: Group): void {
  group.destroyChildren();

  const text = String(deps.state.score);
  const digitWidth = deps.digits[0]?.naturalWidth ?? 24;
  const digitHeight = deps.digits[0]?.naturalHeight ?? 36;
  const totalWidth = text.length * digitWidth;
  let x = (deps.stageWidth - totalWidth) / 2;

  for (const char of text) {
    const image = deps.digits[Number(char)];
    if (!image) continue;
    group.add(new Image({ image, x, y: 20, width: digitWidth, height: digitHeight }));
    x += digitWidth;
  }
}

export interface ScoreSystemControls {
  tick: System;
  resetDisplay: () => void;
}

export function createScoreSystem(deps: ScoreSystemDeps): ScoreSystemControls {
  const group = new Group();
  deps.layer.add(group);
  renderScore(deps, group);

  const tick: System = (registry: Registry) => {
    group.moveToTop();
    if (!deps.state.running || deps.state.gameOver) return;
    void registry;

    for (const { PipeComponent: pipe } of deps.state.pipesTick) {
      if (!pipe.scored && pipe.x + deps.pipeWidth < deps.birdX) {
        pipe.scored = true;
        deps.state.score += 1;
        deps.sound.play("point");
        renderScore(deps, group);
      }
    }
  };

  return {
    tick,
    resetDisplay: () => renderScore(deps, group),
  };
}
