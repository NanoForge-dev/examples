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

    // Replaced by a custom crosshair sprite (cursor.system.ts) - see also this scene's build-bar
    // hover handlers in start-game-packet.handler.ts, which must restore "none" on mouseout
    // rather than the OS default, or hovering a button would bring the OS cursor back for good.
    this.stage.container().style.cursor = "none";

    // Right-click is now a real fire button (the second weapon slot) - without this the browser's
    // native context menu would pop up on every right-click.
    this.stage.container().addEventListener("contextmenu", (e) => e.preventDefault());

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
    // Restore the OS cursor - otherwise it stays hidden (still "none" from load()) on whatever
    // scene comes next, until the player happens to hover something with its own cursor handler.
    this.stage.container().style.cursor = "default";
    this.layer?.destroy();
    this.hudLayer?.destroy();
  }

  tick(): void {}
}