import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/scene";
import "@nanoforge-dev/sound";

import { Bird } from "../components/bird.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { Pipe } from "../components/pipe.component";
import { Position2D } from "../components/position-2d.component";
import { GameOver } from "../scenes/game-over.scene";

/** Milliseconds between the hit sound and the fall sound. */
const DIE_DELAY_MS = 150;

/**
 * Kills the bird when it touches a pipe or the ground, and shows the game over screen over the
 * flight.
 *
 * @system
 * @side client
 */
export const collide = (registry: Registry, ctx: Context) => {
  const pipes = registry.getZipper([Pipe, Position2D, DrawableRect2D]);

  registry
    .getZipper([Bird, Position2D, DrawableRect2D])
    .forEach(({ Bird, Position2D, DrawableRect2D }) => {
      if (Bird.dead) return;
      const halfWidth = (DrawableRect2D.width / 2) * (1 - 2 * Bird.hitboxInset);
      const halfHeight = (DrawableRect2D.height / 2) * (1 - 2 * Bird.hitboxInset);
      const left = Position2D.x - halfWidth;
      const right = Position2D.x + halfWidth;
      const top = Position2D.y - halfHeight;
      const bottom = Position2D.y + halfHeight;

      const hit =
        bottom >= Bird.groundY ||
        pipes.some(({ Pipe, Position2D: pipe, DrawableRect2D: shape }) => {
          // The top pipe is turned by 180 degrees: its position is its bottom-right corner.
          const x = Pipe.top ? pipe.x - shape.width : pipe.x;
          if (right <= x || left >= x + shape.width) return false;
          return Pipe.top ? top < pipe.y : bottom > pipe.y;
        });
      if (!hit) return;

      Bird.dead = true;
      ctx.sound.play("hit");
      setTimeout(() => ctx.sound.play("die"), DIE_DELAY_MS);
      void ctx.scenes.load(ctx, GameOver, { parent: "current" });
    });
};
