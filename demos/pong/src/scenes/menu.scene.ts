import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import { EcsScene } from "@nanoforge-dev/ecs/scene";

import { DrawableText2D } from "../components/drawable-text-2d.component";
import { Position2D } from "../components/position-2d.component";
import { startMatch } from "../systems/start-match.system";

/**
 * The title screen. Enter starts a match.
 *
 * @scene
 * @side client
 */
export class Menu extends EcsScene {
  override setup(registry: Registry, _ctx: Context) {
    const title = registry.spawnEntity();
    registry.addComponent(title, new Position2D(780, 300));
    registry.addComponent(title, new DrawableText2D("PONG", 140, "#cdd6f4", 1, "monospace"));

    const prompt = registry.spawnEntity();
    registry.addComponent(prompt, new Position2D(700, 520));
    registry.addComponent(
      prompt,
      new DrawableText2D("Press Enter to play", 48, "#cdd6f4", 1, "monospace"),
    );

    const keys = registry.spawnEntity();
    registry.addComponent(keys, new Position2D(560, 700));
    registry.addComponent(
      keys,
      new DrawableText2D("Left: W / S      Right: Up / Down", 40, "#8a93ad", 1, "monospace"),
    );

    const rules = registry.spawnEntity();
    registry.addComponent(rules, new Position2D(740, 780));
    registry.addComponent(
      rules,
      new DrawableText2D("First to 5 points wins", 40, "#8a93ad", 1, "monospace"),
    );

    registry.addSystem(startMatch);
  }
}
