import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { Bird } from "../components/bird.component";
import { DrawOrder2D } from "../components/draw-order-2d.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Pipe } from "../components/pipe.component";
import { PipeSpawner } from "../components/pipe-spawner.component";
import { Position2D } from "../components/position-2d.component";
import { ScoreDigit } from "../components/score-digit.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { collide } from "../systems/collide.system";
import { flap } from "../systems/flap.system";
import { fly } from "../systems/fly.system";
import { movePipes } from "../systems/move-pipes.system";
import { scorePipes } from "../systems/score-pipes.system";
import { showScore } from "../systems/show-score.system";
import { Sky } from "./sky.scene";

/**
 * A flight: the bird, three pairs of pipes that come back again and again, and the score. The
 * bird starts with a flap: the one that started the flight.
 *
 * @scene
 * @side client
 * @vars score
 */
export class Play extends EcsScene {
  static override parent = Sky;

  override setup(registry: Registry, ctx: Context) {
    ctx.scenes.vars.init("score", 0);

    const pipe1Top = registry.spawnEntity();
    registry.addComponent(pipe1Top, new Position2D(-100, 0));
    registry.addComponent(
      pipe1Top,
      new DrawableRect2D(52, 320, "#73bf2e", "/pipe-green.png", 1, 180),
    );
    registry.addComponent(pipe1Top, new Pipe(0, true));
    registry.addComponent(pipe1Top, new DrawOrder2D(1));

    const pipe1Bottom = registry.spawnEntity();
    registry.addComponent(pipe1Bottom, new Position2D(-100, 0));
    registry.addComponent(pipe1Bottom, new DrawableRect2D(52, 320, "#73bf2e", "/pipe-green.png"));
    registry.addComponent(pipe1Bottom, new Pipe(0, false));
    registry.addComponent(pipe1Bottom, new DrawOrder2D(1));

    const pipe2Top = registry.spawnEntity();
    registry.addComponent(pipe2Top, new Position2D(-100, 0));
    registry.addComponent(
      pipe2Top,
      new DrawableRect2D(52, 320, "#73bf2e", "/pipe-green.png", 1, 180),
    );
    registry.addComponent(pipe2Top, new Pipe(1, true));
    registry.addComponent(pipe2Top, new DrawOrder2D(1));

    const pipe2Bottom = registry.spawnEntity();
    registry.addComponent(pipe2Bottom, new Position2D(-100, 0));
    registry.addComponent(pipe2Bottom, new DrawableRect2D(52, 320, "#73bf2e", "/pipe-green.png"));
    registry.addComponent(pipe2Bottom, new Pipe(1, false));
    registry.addComponent(pipe2Bottom, new DrawOrder2D(1));

    const pipe3Top = registry.spawnEntity();
    registry.addComponent(pipe3Top, new Position2D(-100, 0));
    registry.addComponent(
      pipe3Top,
      new DrawableRect2D(52, 320, "#73bf2e", "/pipe-green.png", 1, 180),
    );
    registry.addComponent(pipe3Top, new Pipe(2, true));
    registry.addComponent(pipe3Top, new DrawOrder2D(1));

    const pipe3Bottom = registry.spawnEntity();
    registry.addComponent(pipe3Bottom, new Position2D(-100, 0));
    registry.addComponent(pipe3Bottom, new DrawableRect2D(52, 320, "#73bf2e", "/pipe-green.png"));
    registry.addComponent(pipe3Bottom, new Pipe(2, false));
    registry.addComponent(pipe3Bottom, new DrawOrder2D(1));

    const spawner = registry.spawnEntity();
    registry.addComponent(spawner, new PipeSpawner(150, 1.5, 420, 150, 110, 2.5, 16, 60, 448));

    const bird = registry.spawnEntity();
    registry.addComponent(bird, new Position2D(60, 280));
    registry.addComponent(bird, new Velocity2D(0, -430));
    registry.addComponent(bird, new DrawableRect2D(34, 24, "#f8e71c", "/yellowbird-midflap.png"));
    registry.addComponent(bird, new Bird(1500, 430, 640, 448, 0.25));
    registry.addComponent(bird, new DrawOrder2D(3));

    const digit1 = registry.spawnEntity();
    registry.addComponent(digit1, new Position2D(198, 20));
    registry.addComponent(digit1, new DrawableRect2D(24, 36, "#ffffff", "/0.png"));
    registry.addComponent(digit1, new ScoreDigit(0, 210));
    registry.addComponent(digit1, new DrawOrder2D(5));

    const digit2 = registry.spawnEntity();
    registry.addComponent(digit2, new Position2D(198, 20));
    registry.addComponent(digit2, new DrawableRect2D(24, 36, "#ffffff", "/0.png", 1, 0, 0, false));
    registry.addComponent(digit2, new ScoreDigit(1, 210));
    registry.addComponent(digit2, new DrawOrder2D(5));

    const digit3 = registry.spawnEntity();
    registry.addComponent(digit3, new Position2D(198, 20));
    registry.addComponent(digit3, new DrawableRect2D(24, 36, "#ffffff", "/0.png", 1, 0, 0, false));
    registry.addComponent(digit3, new ScoreDigit(2, 210));
    registry.addComponent(digit3, new DrawOrder2D(5));

    registry.addSystem(flap);
    registry.addSystem(fly);
    registry.addSystem(movePipes);
    registry.addSystem(collide);
    registry.addSystem(scorePipes);
    registry.addSystem(showScore);
  }
}
