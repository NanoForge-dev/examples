import { EcsScene } from "@nanoforge-dev/ecs/scene";
import type { SceneClass } from "@nanoforge-dev/scene";

import { Run } from "./scenes/run.scene";

/**
 * What every level has: its parent, `Run`, and the level after it. Levels are siblings under
 * `Run`: moving to the next one unloads this one (its bricks and its vars) and keeps the paddle,
 * the ball, the score and the lives. Each level writes its own bricks in its `setup`.
 *
 * It is outside `scenes/`, which holds one scene per file, and imports no scene but `Run`: the
 * levels extend it when their module is evaluated.
 */
export abstract class Level extends EcsScene {
  static override parent = Run;

  /** The level after this one; the last one has none. */
  abstract readonly next: SceneClass | undefined;
}
