import { Scene } from "./Scene";
import { Registry } from "@nanoforge-dev/ecs-client";
import { Layer, Stage } from "@nanoforge-dev/graphics-2d";
import { RectComponent } from "../components/renderable/rect.component";
import { TextComponent } from "../components/renderable/text.component";
import { MenuScene } from "./MenuScene";
import { sceneManager } from "../main";

// Doubles as the victory screen - same layout and Retry flow either way, just the headline/accent
// color changes based on `won`.
export class GameOverScene implements Scene {
  readonly name = "gameOver";
  layer: Layer | undefined;
  private stage!: Stage;

  constructor(
    private zombiesKilled: number,
    private won: boolean = false,
  ) {}

  load(registry: Registry, stage: Stage): void {
    this.stage = stage;

    this.layer = new Layer();
    this.stage.add(this.layer);

    registry.addComponent(
      registry.spawnEntity(),
      new RectComponent(this.layer, {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        fill: "#0B2E1A",
      }),
    );

    const panelSize = { width: 420, height: 280 };
    const panelX = window.innerWidth / 2 - panelSize.width / 2;
    const panelY = window.innerHeight / 2 - panelSize.height / 2;

    registry.addComponent(
      registry.spawnEntity(),
      new RectComponent(this.layer, {
        x: panelX,
        y: panelY,
        width: panelSize.width,
        height: panelSize.height,
        fill: "#104522",
        cornerRadius: 5,
      }),
    );

    registry.addComponent(
      registry.spawnEntity(),
      new TextComponent(this.layer, {
        text: this.won ? "VICTORY!" : "GAME OVER",
        x: panelX,
        y: panelY + 30,
        width: panelSize.width,
        height: 40,
        fontSize: 32,
        fontStyle: "bold",
        align: "center",
        fill: this.won ? "#D9A441" : "#E88686",
      }),
    );

    registry.addComponent(
      registry.spawnEntity(),
      new TextComponent(this.layer, {
        text: this.won ? "All waves survived!" : "The raid has fallen.",
        x: panelX,
        y: panelY + 78,
        width: panelSize.width,
        height: 20,
        fontSize: 14,
        align: "center",
        fill: "#8FBB9B",
      }),
    );

    registry.addComponent(
      registry.spawnEntity(),
      new TextComponent(this.layer, {
        text: `Zombies killed: ${this.zombiesKilled}`,
        x: panelX,
        y: panelY + 106,
        width: panelSize.width,
        height: 30,
        fontSize: 20,
        align: "center",
        fill: "#F5F2E9",
      }),
    );

    const buttonSize = { width: 220, height: 50 };
    const buttonX = panelX + panelSize.width / 2 - buttonSize.width / 2;
    const buttonY = panelY + panelSize.height - buttonSize.height - 30;

    const retryButtonComponent = new RectComponent(this.layer, {
      x: buttonX,
      y: buttonY,
      width: buttonSize.width,
      height: buttonSize.height,
      cornerRadius: 10,
      fill: "#1F6B45",
      stroke: "#5E8C61",
      strokeWidth: 2,
      shadowEnabled: false,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    });
    registry.addComponent(registry.spawnEntity(), retryButtonComponent);

    retryButtonComponent.rect.on("mouseover", () => {
      retryButtonComponent.rect.shadowEnabled(true);
      this.stage.container().style.cursor = "pointer";
    });
    retryButtonComponent.rect.on("mouseout", () => {
      retryButtonComponent.rect.shadowEnabled(false);
      this.stage.container().style.cursor = "default";
    });
    retryButtonComponent.rect.on("click", () => {
      this.stage.container().style.cursor = "default";
      sceneManager.switchTo(new MenuScene());
    });

    registry.addComponent(
      registry.spawnEntity(),
      new TextComponent(this.layer, {
        text: this.won ? "Play Again" : "Retry",
        x: buttonX,
        y: buttonY,
        width: buttonSize.width,
        height: buttonSize.height,
        fontSize: 22,
        verticalAlign: "middle",
        align: "center",
        fill: "#F5F2E9",
        fontStyle: "bold",
        listening: false,
      }),
    );
  }

  unload(): void {
    this.layer?.destroy();
  }

  tick(): void {}
}
