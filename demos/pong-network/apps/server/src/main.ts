import type { RunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/server";
import { EditorLibrary } from "@nanoforge-dev/editor-lib";
import { NetworkServerLibrary } from "@nanoforge-dev/network/server";

import { Ball } from "./components/ball.component";
import { Goal } from "./components/goal.component";
import { HitboxRect2D } from "./components/hitbox-rect-2d.component";
import { NetworkId } from "./components/network-id.component";
import { Paddle } from "./components/paddle.component";
import { Position2D } from "./components/position-2d.component";
import { Seat } from "./components/seat.component";
import { Serve } from "./components/serve.component";
import { Velocity2D } from "./components/velocity-2d.component";
import { Wall } from "./components/wall.component";
import { blockPaddles } from "./systems/block-paddles.system";
import { bounceBall } from "./systems/bounce-ball.system";
import { move2D } from "./systems/move-2d.system";
import { scoreGoals } from "./systems/score-goals.system";
import { seatPlayers } from "./systems/seat-players.system";
import { serveBall } from "./systems/serve-ball.system";
import { steerPaddles } from "./systems/steer-paddles.system";
import { syncMoves } from "./systems/sync-moves.system";

export const main = async (options: RunOptions): Promise<void> => {
  const app = NanoforgeFactory.createServer({ tickRate: 60 });
  const ecs = new EcsLibrary();

  app.use(ecs);
  app.use(new NetworkServerLibrary());
  app.use(new EditorLibrary());

  await app.init(options);

  const registry = ecs.registry;

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

  const ball = registry.spawnEntity();
  registry.addComponent(ball, new Position2D(945, 525));
  registry.addComponent(ball, new Velocity2D(0, 0));
  registry.addComponent(ball, new HitboxRect2D(30, 30));
  registry.addComponent(ball, new Ball());
  registry.addComponent(ball, new Serve(945, 525, 1000, 3));
  registry.addComponent(ball, new NetworkId(0));

  const leftPaddle = registry.spawnEntity();
  registry.addComponent(leftPaddle, new Position2D(20, 390));
  registry.addComponent(leftPaddle, new Velocity2D(0, 0));
  registry.addComponent(leftPaddle, new HitboxRect2D(30, 300));
  registry.addComponent(leftPaddle, new Paddle(1, 0, 67.5, 1.1));
  registry.addComponent(leftPaddle, new Seat(1, 1000));
  registry.addComponent(leftPaddle, new NetworkId(1));

  const rightPaddle = registry.spawnEntity();
  registry.addComponent(rightPaddle, new Position2D(1870, 390));
  registry.addComponent(rightPaddle, new Velocity2D(0, 0));
  registry.addComponent(rightPaddle, new HitboxRect2D(30, 300));
  registry.addComponent(rightPaddle, new Paddle(-1, 0, 67.5, 1.1));
  registry.addComponent(rightPaddle, new Seat(2, 1000));
  registry.addComponent(rightPaddle, new NetworkId(2));

  registry.addSystem(seatPlayers);
  registry.addSystem(steerPaddles);
  registry.addSystem(serveBall);
  registry.addSystem(move2D);
  registry.addSystem(blockPaddles);
  registry.addSystem(bounceBall);
  registry.addSystem(scoreGoals);
  registry.addSystem(syncMoves);

  await app.run();
};
