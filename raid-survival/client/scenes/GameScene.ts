import { Scene } from "./Scene";
import { Registry } from "@nanoforge-dev/ecs-client";
import { Layer, Stage } from "@nanoforge-dev/graphics-2d";
import { Position } from "../components/position.component";
import { SpriteComponent } from "../components/renderable/sprite.component";

export class GameScene implements Scene {
  readonly name = "GameScene";
  layer: Layer | undefined;

  private stage!: Stage;

  load(registry: Registry, stage: Stage): void {
    this.stage = stage;

    this.layer = new Layer();
    this.stage.add(this.layer);

    const map = registry.spawnEntity();
    registry.addComponent(map, new Position(0, 0));
    registry.addComponent(
      map,
      new SpriteComponent("map.png", { layer: this.layer, scale: { x: 3, y: 3 } }),
    );
  }

  tick(): void {}
}