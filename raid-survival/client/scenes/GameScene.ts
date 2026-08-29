import { Scene } from "./Scene";
import { Registry } from "@nanoforge-dev/ecs-client";
import { Layer, Stage } from "@nanoforge-dev/graphics-2d";
import { TransformComponent } from "../components/essentials/transform.component";
import { SpriteComponent } from "../components/renderable/sprite.component";

export class GameScene implements Scene {
  readonly name = "GameScene";
  layer: Layer | undefined;
  // Separate, unscaled layer for screen-space UI (the wave HUD) - cameraFollowSystem only ever
  // pans/zooms `layer` (the 3x-scaled world), so anything added here stays fixed on screen
  // regardless of camera movement.
  hudLayer: Layer | undefined;

  private stage!: Stage;

  load(registry: Registry, stage: Stage): void {
    this.stage = stage;


    this.layer = new Layer();
    this.layer?.scale({x: 3, y: 3});
    const context = this.layer.getCanvas()._canvas.getContext("2d");
    if (context) context.imageSmoothingEnabled = false;
    this.stage.add(this.layer);

    this.hudLayer = new Layer();
    this.stage.add(this.hudLayer);

    const map = registry.spawnEntity();
    registry.addComponent(map, new TransformComponent(0, 0));
    registry.addComponent(map, new SpriteComponent("map.png", { layer: this.layer }));
  }

  unload() {
    this.layer?.destroy();
    this.hudLayer?.destroy();
  }

  tick(): void {}
}