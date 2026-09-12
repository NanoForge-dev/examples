import { Registry } from "@nanoforge-dev/ecs-client";
import { Scene } from "./Scene";
import { Stage } from "@nanoforge-dev/graphics-2d";

export class SceneManager {
  private current: Scene | null = null;

  constructor(
    private registry: Registry,
    private stage: Stage,
  ) {}

  switchTo(scene: Scene) {
    this.current?.unload?.(this.registry, this.stage);
    this.registry.clearEntities();
    this.stage.clear();

    this.current = scene;
    scene.load(this.registry, this.stage);
  }

  getScene(): Scene | null {
    return this.current;
  }
}
