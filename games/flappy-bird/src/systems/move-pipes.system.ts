import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/scene";

import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Pipe } from "../components/pipe.component";
import { PipeSpawner } from "../components/pipe-spawner.component";
import { Position2D } from "../components/position-2d.component";

/**
 * Moves the pipes to the left and, every `interval`, brings back a pair that left the screen on
 * the right, with a new gap: smaller as the score grows. Stops when the bird dies.
 *
 * @system
 * @side client
 */
export const movePipes = (registry: Registry, ctx: Context) => {
  const vars = ctx.scenes.vars;
  if (vars.has("over")) return;
  const seconds = Math.min(ctx.app.delta / 1000, 1 / 30);
  const pipes = registry.getZipper([Pipe, Position2D, DrawableRect2D]);

  registry.getZipper([PipeSpawner]).forEach(({ PipeSpawner: spawner }) => {
    for (const { Position2D } of pipes) Position2D.x -= spawner.speed * seconds;

    spawner.timer -= seconds;
    if (spawner.timer > 0) return;
    spawner.timer = spawner.interval;

    const free = pipes.find(
      ({ Pipe, Position2D, DrawableRect2D }) =>
        !Pipe.top && Position2D.x + DrawableRect2D.width < 0,
    );
    if (!free) return;

    const score = vars.get("score") ?? 0;
    const shrunk = Math.max(spawner.minGap, spawner.baseGap - score * spawner.gapStep);
    const gap = Math.max(spawner.minGap, shrunk + (Math.random() * 2 - 1) * spawner.gapJitter);
    const lowest = gap / 2 + spawner.margin;
    const highest = spawner.groundY - gap / 2 - spawner.margin;
    const center = lowest + Math.random() * Math.max(0, highest - lowest);

    for (const { Pipe, Position2D, DrawableRect2D } of pipes) {
      if (Pipe.pair !== free.Pipe.pair) continue;
      Pipe.scored = false;
      // The top pipe is turned by 180 degrees around its `Position2D`.
      Position2D.x = Pipe.top ? spawner.startX + DrawableRect2D.width : spawner.startX;
      Position2D.y = Pipe.top ? center - gap / 2 : center + gap / 2;
    }
  });
};
