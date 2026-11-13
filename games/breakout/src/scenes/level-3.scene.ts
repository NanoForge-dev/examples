import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { Brick } from "../components/brick.component";
import { DrawableRect2D } from "../components/drawable-rect-2d.component";
import { HitboxRect2D } from "../components/hitbox-rect-2d.component";
import { Position2D } from "../components/position-2d.component";
import { Wall } from "../components/wall.component";
import { Level } from "../level";
import { levelFlow } from "../systems/level-flow.system";
import { pauseOnEscape } from "../systems/pause-on-escape.system";

/**
 * Level 3: bricks that take two hits, faster still. The last level.
 *
 * @scene
 * @side client
 * @vars level, bricksLeft, ballSpeed, served
 */
export class Level3 extends Level {
  readonly next = undefined;

  override setup(registry: Registry, ctx: Context) {
    // Owned by the level: gone when the next one is loaded, which makes its own.
    ctx.scenes.vars.init("level", 3);
    ctx.scenes.vars.init("bricksLeft", 24);
    ctx.scenes.vars.init("ballSpeed", 650);
    ctx.scenes.vars.init("served", false);

    const brick1 = registry.spawnEntity();
    registry.addComponent(brick1, new Position2D(48, 130));
    registry.addComponent(brick1, new HitboxRect2D(141, 26));
    registry.addComponent(brick1, new Wall());
    registry.addComponent(brick1, new Brick(2, 20));
    registry.addComponent(brick1, new DrawableRect2D(141, 26, "#eb4d4b", "", 1, 0, 0));

    const brick2 = registry.spawnEntity();
    registry.addComponent(brick2, new Position2D(197, 130));
    registry.addComponent(brick2, new HitboxRect2D(141, 26));
    registry.addComponent(brick2, new Wall());
    registry.addComponent(brick2, new Brick(2, 20));
    registry.addComponent(brick2, new DrawableRect2D(141, 26, "#eb4d4b", "", 1, 0, 0));

    const brick3 = registry.spawnEntity();
    registry.addComponent(brick3, new Position2D(346, 130));
    registry.addComponent(brick3, new HitboxRect2D(141, 26));
    registry.addComponent(brick3, new Wall());
    registry.addComponent(brick3, new Brick(2, 20));
    registry.addComponent(brick3, new DrawableRect2D(141, 26, "#eb4d4b", "", 1, 0, 0));

    const brick4 = registry.spawnEntity();
    registry.addComponent(brick4, new Position2D(495, 130));
    registry.addComponent(brick4, new HitboxRect2D(141, 26));
    registry.addComponent(brick4, new Wall());
    registry.addComponent(brick4, new Brick(2, 20));
    registry.addComponent(brick4, new DrawableRect2D(141, 26, "#eb4d4b", "", 1, 0, 0));

    const brick5 = registry.spawnEntity();
    registry.addComponent(brick5, new Position2D(644, 130));
    registry.addComponent(brick5, new HitboxRect2D(141, 26));
    registry.addComponent(brick5, new Wall());
    registry.addComponent(brick5, new Brick(2, 20));
    registry.addComponent(brick5, new DrawableRect2D(141, 26, "#eb4d4b", "", 1, 0, 0));

    const brick6 = registry.spawnEntity();
    registry.addComponent(brick6, new Position2D(793, 130));
    registry.addComponent(brick6, new HitboxRect2D(141, 26));
    registry.addComponent(brick6, new Wall());
    registry.addComponent(brick6, new Brick(2, 20));
    registry.addComponent(brick6, new DrawableRect2D(141, 26, "#eb4d4b", "", 1, 0, 0));

    const brick7 = registry.spawnEntity();
    registry.addComponent(brick7, new Position2D(942, 130));
    registry.addComponent(brick7, new HitboxRect2D(141, 26));
    registry.addComponent(brick7, new Wall());
    registry.addComponent(brick7, new Brick(2, 20));
    registry.addComponent(brick7, new DrawableRect2D(141, 26, "#eb4d4b", "", 1, 0, 0));

    const brick8 = registry.spawnEntity();
    registry.addComponent(brick8, new Position2D(1091, 130));
    registry.addComponent(brick8, new HitboxRect2D(141, 26));
    registry.addComponent(brick8, new Wall());
    registry.addComponent(brick8, new Brick(2, 20));
    registry.addComponent(brick8, new DrawableRect2D(141, 26, "#eb4d4b", "", 1, 0, 0));

    const brick9 = registry.spawnEntity();
    registry.addComponent(brick9, new Position2D(48, 164));
    registry.addComponent(brick9, new HitboxRect2D(141, 26));
    registry.addComponent(brick9, new Wall());
    registry.addComponent(brick9, new Brick(1, 10));
    registry.addComponent(brick9, new DrawableRect2D(141, 26, "#f0932b", "", 1, 0, 4));

    const brick10 = registry.spawnEntity();
    registry.addComponent(brick10, new Position2D(346, 164));
    registry.addComponent(brick10, new HitboxRect2D(141, 26));
    registry.addComponent(brick10, new Wall());
    registry.addComponent(brick10, new Brick(1, 10));
    registry.addComponent(brick10, new DrawableRect2D(141, 26, "#f0932b", "", 1, 0, 4));

    const brick11 = registry.spawnEntity();
    registry.addComponent(brick11, new Position2D(793, 164));
    registry.addComponent(brick11, new HitboxRect2D(141, 26));
    registry.addComponent(brick11, new Wall());
    registry.addComponent(brick11, new Brick(1, 10));
    registry.addComponent(brick11, new DrawableRect2D(141, 26, "#f0932b", "", 1, 0, 4));

    const brick12 = registry.spawnEntity();
    registry.addComponent(brick12, new Position2D(1091, 164));
    registry.addComponent(brick12, new HitboxRect2D(141, 26));
    registry.addComponent(brick12, new Wall());
    registry.addComponent(brick12, new Brick(1, 10));
    registry.addComponent(brick12, new DrawableRect2D(141, 26, "#f0932b", "", 1, 0, 4));

    const brick13 = registry.spawnEntity();
    registry.addComponent(brick13, new Position2D(48, 198));
    registry.addComponent(brick13, new HitboxRect2D(141, 26));
    registry.addComponent(brick13, new Wall());
    registry.addComponent(brick13, new Brick(2, 20));
    registry.addComponent(brick13, new DrawableRect2D(141, 26, "#f9ca24", "", 1, 0, 0));

    const brick14 = registry.spawnEntity();
    registry.addComponent(brick14, new Position2D(197, 198));
    registry.addComponent(brick14, new HitboxRect2D(141, 26));
    registry.addComponent(brick14, new Wall());
    registry.addComponent(brick14, new Brick(1, 10));
    registry.addComponent(brick14, new DrawableRect2D(141, 26, "#f9ca24", "", 1, 0, 4));

    const brick15 = registry.spawnEntity();
    registry.addComponent(brick15, new Position2D(346, 198));
    registry.addComponent(brick15, new HitboxRect2D(141, 26));
    registry.addComponent(brick15, new Wall());
    registry.addComponent(brick15, new Brick(2, 20));
    registry.addComponent(brick15, new DrawableRect2D(141, 26, "#f9ca24", "", 1, 0, 0));

    const brick16 = registry.spawnEntity();
    registry.addComponent(brick16, new Position2D(495, 198));
    registry.addComponent(brick16, new HitboxRect2D(141, 26));
    registry.addComponent(brick16, new Wall());
    registry.addComponent(brick16, new Brick(1, 10));
    registry.addComponent(brick16, new DrawableRect2D(141, 26, "#f9ca24", "", 1, 0, 4));

    const brick17 = registry.spawnEntity();
    registry.addComponent(brick17, new Position2D(644, 198));
    registry.addComponent(brick17, new HitboxRect2D(141, 26));
    registry.addComponent(brick17, new Wall());
    registry.addComponent(brick17, new Brick(1, 10));
    registry.addComponent(brick17, new DrawableRect2D(141, 26, "#f9ca24", "", 1, 0, 4));

    const brick18 = registry.spawnEntity();
    registry.addComponent(brick18, new Position2D(793, 198));
    registry.addComponent(brick18, new HitboxRect2D(141, 26));
    registry.addComponent(brick18, new Wall());
    registry.addComponent(brick18, new Brick(2, 20));
    registry.addComponent(brick18, new DrawableRect2D(141, 26, "#f9ca24", "", 1, 0, 0));

    const brick19 = registry.spawnEntity();
    registry.addComponent(brick19, new Position2D(942, 198));
    registry.addComponent(brick19, new HitboxRect2D(141, 26));
    registry.addComponent(brick19, new Wall());
    registry.addComponent(brick19, new Brick(1, 10));
    registry.addComponent(brick19, new DrawableRect2D(141, 26, "#f9ca24", "", 1, 0, 4));

    const brick20 = registry.spawnEntity();
    registry.addComponent(brick20, new Position2D(1091, 198));
    registry.addComponent(brick20, new HitboxRect2D(141, 26));
    registry.addComponent(brick20, new Wall());
    registry.addComponent(brick20, new Brick(2, 20));
    registry.addComponent(brick20, new DrawableRect2D(141, 26, "#f9ca24", "", 1, 0, 0));

    const brick21 = registry.spawnEntity();
    registry.addComponent(brick21, new Position2D(48, 232));
    registry.addComponent(brick21, new HitboxRect2D(141, 26));
    registry.addComponent(brick21, new Wall());
    registry.addComponent(brick21, new Brick(2, 20));
    registry.addComponent(brick21, new DrawableRect2D(141, 26, "#6ab04c", "", 1, 0, 0));

    const brick22 = registry.spawnEntity();
    registry.addComponent(brick22, new Position2D(346, 232));
    registry.addComponent(brick22, new HitboxRect2D(141, 26));
    registry.addComponent(brick22, new Wall());
    registry.addComponent(brick22, new Brick(2, 20));
    registry.addComponent(brick22, new DrawableRect2D(141, 26, "#6ab04c", "", 1, 0, 0));

    const brick23 = registry.spawnEntity();
    registry.addComponent(brick23, new Position2D(793, 237));
    registry.addComponent(brick23, new HitboxRect2D(141, 26));
    registry.addComponent(brick23, new Wall());
    registry.addComponent(brick23, new Brick(2, 20));
    registry.addComponent(brick23, new DrawableRect2D(141, 26, "#6ab04c", "", 1, 0, 0));

    const brick24 = registry.spawnEntity();
    registry.addComponent(brick24, new Position2D(1091, 232));
    registry.addComponent(brick24, new HitboxRect2D(141, 26));
    registry.addComponent(brick24, new Wall());
    registry.addComponent(brick24, new Brick(2, 20));
    registry.addComponent(brick24, new DrawableRect2D(141, 26, "#6ab04c", "", 1, 0, 0));

    registry.addSystem(levelFlow);
    registry.addSystem(pauseOnEscape);
  }
}
