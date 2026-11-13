import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";
import { InputEnum } from "@nanoforge-dev/input";

import { Ball } from "../components/ball.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { DrawableText2D } from "../components/drawable-text-2d.component";
import { Goal } from "../components/goal.component";
import { HitboxRect2D } from "../components/hitbox-rect-2d.component";
import { MoveController2D } from "../components/move-controller-2d.component";
import { Paddle } from "../components/paddle.component";
import { Position2D } from "../components/position-2d.component";
import { ScoreText } from "../components/score-text.component";
import { Serve } from "../components/serve.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { Wall } from "../components/wall.component";
import { blockPaddles } from "../systems/block-paddles.system";
import { bounceBall } from "../systems/bounce-ball.system";
import { move2D } from "../systems/move-2d.system";
import { moveControl2D } from "../systems/move-control-2d.system";
import { scoreGoals } from "../systems/score-goals.system";
import { serveBall } from "../systems/serve-ball.system";
import { showScores } from "../systems/show-scores.system";
import { winMatch } from "../systems/win-match.system";

/**
 * A match: the field, the two paddles, the ball and the scores. W and S move the left paddle,
 * the up and down arrows the right one.
 *
 * @scene
 * @side client
 * @vars pointsToWin
 */
export class Match extends EcsScene {
  override setup(registry: Registry, ctx: Context) {
    ctx.scenes.vars.init("pointsToWin", 5);

    const centerLine = registry.spawnEntity();
    registry.addComponent(centerLine, new Position2D(955, 0));
    registry.addComponent(centerLine, new DrawableRect2D(10, 1080, "#94cc75"));

    const topWall = registry.spawnEntity();
    registry.addComponent(topWall, new Position2D(0, -100));
    registry.addComponent(topWall, new HitboxRect2D(1920, 100));
    registry.addComponent(topWall, new Wall());

    const bottomWall = registry.spawnEntity();
    registry.addComponent(bottomWall, new Position2D(0, 1080));
    registry.addComponent(bottomWall, new HitboxRect2D(1920, 100));
    registry.addComponent(bottomWall, new Wall());

    const leftGoal = registry.spawnEntity();
    registry.addComponent(leftGoal, new Position2D(-100, 0));
    registry.addComponent(leftGoal, new HitboxRect2D(100, 1080));
    registry.addComponent(leftGoal, new Goal(2));

    const rightGoal = registry.spawnEntity();
    registry.addComponent(rightGoal, new Position2D(1920, 0));
    registry.addComponent(rightGoal, new HitboxRect2D(100, 1080));
    registry.addComponent(rightGoal, new Goal(1));

    const leftPaddle = registry.spawnEntity();
    registry.addComponent(leftPaddle, new Position2D(20, 390));
    registry.addComponent(leftPaddle, new Velocity2D(0, 0));
    registry.addComponent(leftPaddle, new HitboxRect2D(30, 300));
    registry.addComponent(leftPaddle, new Paddle(1, 0, 67.5, 1.1));
    registry.addComponent(
      leftPaddle,
      new MoveController2D(
        1000,
        "vertical",
        InputEnum.KeyA,
        InputEnum.KeyD,
        InputEnum.KeyW,
        InputEnum.KeyS,
      ),
    );
    registry.addComponent(leftPaddle, new DrawableRect2D(30, 300, "#4d8dff"));

    const rightPaddle = registry.spawnEntity();
    registry.addComponent(rightPaddle, new Position2D(1870, 390));
    registry.addComponent(rightPaddle, new Velocity2D(0, 0));
    registry.addComponent(rightPaddle, new HitboxRect2D(30, 300));
    registry.addComponent(rightPaddle, new Paddle(-1, 0, 67.5, 1.1));
    registry.addComponent(rightPaddle, new MoveController2D(1000, "vertical"));
    registry.addComponent(rightPaddle, new DrawableRect2D(30, 300, "#ff9f40"));

    const ball = registry.spawnEntity();
    registry.addComponent(ball, new Position2D(945, 525));
    registry.addComponent(ball, new Velocity2D(0, 0));
    registry.addComponent(ball, new HitboxRect2D(30, 30));
    registry.addComponent(ball, new Ball());
    registry.addComponent(ball, new Serve(945, 525, 1000, 1.5));
    registry.addComponent(ball, new DrawableRect2D(30, 30, "#ff4d3d", "", 1, 0, 15));

    const leftScore = registry.spawnEntity();
    registry.addComponent(leftScore, new Position2D(840, 40));
    registry.addComponent(leftScore, new ScoreText(1));
    registry.addComponent(leftScore, new DrawableText2D("0", 72, "#ffffff", 1, "monospace"));

    const rightScore = registry.spawnEntity();
    registry.addComponent(rightScore, new Position2D(1040, 40));
    registry.addComponent(rightScore, new ScoreText(2));
    registry.addComponent(rightScore, new DrawableText2D("0", 72, "#ffffff", 1, "monospace"));

    registry.addSystem(moveControl2D);
    registry.addSystem(serveBall);
    registry.addSystem(move2D);
    registry.addSystem(blockPaddles);
    registry.addSystem(bounceBall);
    registry.addSystem(scoreGoals);
    registry.addSystem(showScores);
    registry.addSystem(winMatch);
  }
}
