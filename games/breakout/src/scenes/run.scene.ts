import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { Ball } from "../components/ball.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { DrawableText2D } from "../components/drawable-text-2d.component";
import { HitboxRect2D } from "../components/hitbox-rect-2d.component";
import { HudText } from "../components/hud-text.component";
import { MoveController2D } from "../components/move-controller-2d.component";
import { Paddle } from "../components/paddle.component";
import { Position2D } from "../components/position-2d.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { Wall } from "../components/wall.component";
import { breakBricks } from "../systems/break-bricks.system";
import { collide } from "../systems/collide.system";
import { controlPaddle } from "../systems/control-paddle.system";
import { holdBall } from "../systems/hold-ball.system";
import { loseBall } from "../systems/lose-ball.system";
import { moveAll } from "../systems/move-all.system";
import { updateHud } from "../systems/update-hud.system";

/**
 * A game, from the first level to the last or to the last life: the walls, the paddle, the ball
 * and the top bar. The levels are loaded under it, so they keep the paddle, the ball, the score
 * and the lives.
 *
 * It must not import a level (or anything that does): the levels name it as their parent when
 * their module is evaluated.
 *
 * @scene
 * @side client
 * @vars score, lives
 */
export class Run extends EcsScene {
  override setup(registry: Registry, ctx: Context) {
    ctx.scenes.vars.init("score", 0);
    ctx.scenes.vars.init("lives", 3);

    const topBar = registry.spawnEntity();
    registry.addComponent(topBar, new Position2D(0, 0));
    registry.addComponent(topBar, new HitboxRect2D(1280, 90));
    registry.addComponent(topBar, new Wall());
    registry.addComponent(topBar, new DrawableRect2D(1280, 80, "#1b2133"));

    const leftWall = registry.spawnEntity();
    registry.addComponent(leftWall, new Position2D(0, 80));
    registry.addComponent(leftWall, new HitboxRect2D(40, 640));
    registry.addComponent(leftWall, new Wall());
    registry.addComponent(leftWall, new DrawableRect2D(40, 640, "#2a3350"));

    const rightWall = registry.spawnEntity();
    registry.addComponent(rightWall, new Position2D(1240, 80));
    registry.addComponent(rightWall, new HitboxRect2D(40, 640));
    registry.addComponent(rightWall, new Wall());
    registry.addComponent(rightWall, new DrawableRect2D(40, 640, "#2a3350"));

    const score = registry.spawnEntity();
    registry.addComponent(score, new Position2D(60, 28));
    registry.addComponent(score, new HudText("score"));
    registry.addComponent(score, new DrawableText2D("", 30, "#e8ecf8", 1, "monospace"));

    const level = registry.spawnEntity();
    registry.addComponent(level, new Position2D(577, 28));
    registry.addComponent(level, new HudText("level"));
    registry.addComponent(level, new DrawableText2D("", 30, "#e8ecf8", 1, "monospace"));

    const lives = registry.spawnEntity();
    registry.addComponent(lives, new Position2D(1094, 28));
    registry.addComponent(lives, new HudText("lives"));
    registry.addComponent(lives, new DrawableText2D("", 30, "#e8ecf8", 1, "monospace"));

    const paddle = registry.spawnEntity();
    registry.addComponent(paddle, new Position2D(560, 660));
    registry.addComponent(paddle, new Velocity2D(0, 0));
    registry.addComponent(paddle, new HitboxRect2D(160, 18));
    registry.addComponent(paddle, new Paddle(0, -1, 60, 1));
    registry.addComponent(paddle, new MoveController2D(900, "horizontal"));
    registry.addComponent(paddle, new DrawableRect2D(160, 18, "#4aa3ff", "", 1, 0, 6));

    const ball = registry.spawnEntity();
    registry.addComponent(ball, new Position2D(631, 640));
    registry.addComponent(ball, new Velocity2D(0, 0));
    registry.addComponent(ball, new HitboxRect2D(18, 18));
    registry.addComponent(ball, new Ball());
    registry.addComponent(ball, new DrawableRect2D(18, 18, "#ffffff", "", 1, 0, 9));

    registry.addSystem(controlPaddle);
    registry.addSystem(moveAll);
    registry.addSystem(collide);
    registry.addSystem(holdBall);
    registry.addSystem(breakBricks);
    registry.addSystem(loseBall);
    registry.addSystem(updateHud);
  }
}
