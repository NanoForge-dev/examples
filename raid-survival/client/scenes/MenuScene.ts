import { Scene } from "./Scene";
import { Container, Easings, Group, Layer, Stage, Tween } from "@nanoforge-dev/graphics-2d";
import { Registry } from "@nanoforge-dev/ecs-client";

import { RectComponent } from "../components/renderable/rect.component";
import { TextAreaComponent } from "../components/renderable/textarea.component";
import { GroupComponent } from "../components/renderable/group.component";
import { TextComponent } from "../components/renderable/text.component";
import { LobbyAction, LobbyState, LobbyStatusComponent } from "../components/lobby/lobby-status";

export class MenuScene implements Scene {
  readonly name = "menu";
  layer: Layer | undefined;
  private stage!: Stage;

  private lobbyStatusComponent: LobbyStatusComponent | undefined;

  private joinLobbyGroup: Group | undefined;
  private lobbyGroup: Group | undefined;

  private menu: "User" | "Lobby" = "User";
  private playerCases: TextComponent[] = [];

  load(registry: Registry, stage: Stage): void {
    const lobbyStatus = registry.spawnEntity();
    this.lobbyStatusComponent = new LobbyStatusComponent();
    registry.addComponent(lobbyStatus, this.lobbyStatusComponent);

    this.stage = stage;

    this.layer = new Layer();
    this.stage.add(this.layer);

    const background = registry.spawnEntity();
    registry.addComponent(
      background,
      new RectComponent(this.layer, {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        fill: "#0B2E1A",
      }),
    );

    const mainWidgetSize = { width: 500, height: 600 };
    const mainWidgetGroup = registry.spawnEntity();
    const mainWidgetGroupComponent = new GroupComponent(this.layer, {
      x: window.innerWidth / 2 - mainWidgetSize.width / 2,
      y: window.innerHeight / 2 - mainWidgetSize.height / 2,
      width: mainWidgetSize.width,
      height: mainWidgetSize.height,
      clip: {
        x: 0,
        y: 0,
        width: mainWidgetSize.width,
        height: mainWidgetSize.height,
      },
    });
    registry.addComponent(mainWidgetGroup, mainWidgetGroupComponent);

    const mainWidgetBackground = registry.spawnEntity();
    registry.addComponent(
      mainWidgetBackground,
      new RectComponent(mainWidgetGroupComponent.group, {
        x: 0,
        y: 0,
        width: mainWidgetGroupComponent.group.width(),
        height: mainWidgetGroupComponent.group.height(),
        fill: "#104522",
        cornerRadius: 5,
      }),
    );

    this.joinLobbyGroup = this.buildJoinLobbyWidget(registry, mainWidgetGroupComponent.group).group;
    this.lobbyGroup = this.buildLobbyWidget(registry, mainWidgetGroupComponent.group).group;
  }

  unload(): void {
    this.layer?.destroy();
  }

  tick(registry: Registry) {
    const entities: { LobbyStatusComponent: LobbyStatusComponent }[] = registry.getZipper([
      LobbyStatusComponent,
    ]);
    const firstLobbyStatus = entities[0];

    if (!firstLobbyStatus) return;

    if (
      firstLobbyStatus.LobbyStatusComponent.state === LobbyState.JOINED &&
      this.menu !== "Lobby"
    ) {
      this.menu = "Lobby";
      if (this.joinLobbyGroup && this.lobbyGroup) {
        new Tween({
          node: this.joinLobbyGroup,
          duration: 0.4,
          x: -this.joinLobbyGroup.width(),
          easing: Easings.EaseInOut,
        }).play();
        new Tween({
          node: this.lobbyGroup,
          duration: 0.4,
          x: 0,
          easing: Easings.EaseInOut,
        }).play();
      }
    }

    for (let i = 0; i < firstLobbyStatus.LobbyStatusComponent.players.length; i += 1) {
      const textPlayerCase = this.playerCases[i];
      const player = firstLobbyStatus.LobbyStatusComponent.players[i];
      if (!textPlayerCase || !player) return;

      textPlayerCase.text.text(player.username);
    }
  }

  private buildJoinLobbyWidget(registry: Registry, parent: Container): GroupComponent {
    const joinLobbyGroup = registry.spawnEntity();
    const joinLobbyGroupComponent = new GroupComponent(parent, {
      x: 0,
      y: 0,
      width: parent.width(),
      height: parent.height(),
    });
    registry.addComponent(joinLobbyGroup, joinLobbyGroupComponent);

    const pseudoTextSize = { width: 300, height: 30 };
    const pseudoTextBackground = registry.spawnEntity();
    registry.addComponent(
      pseudoTextBackground,
      new RectComponent(joinLobbyGroupComponent.group, {
        x: joinLobbyGroupComponent.group.width() / 2 - pseudoTextSize.width / 2,
        y: joinLobbyGroupComponent.group.height() / 2 - pseudoTextSize.height / 2,
        width: pseudoTextSize.width,
        height: pseudoTextSize.height,
        fill: "#FFFFFF",
      }),
    );
    const pseudoText = registry.spawnEntity();
    const pseudoTextComponent = new TextAreaComponent(joinLobbyGroupComponent.group, {
      text: "Player" + Math.floor(Math.random() * 10000).toString(),
      x: joinLobbyGroupComponent.group.width() / 2 - pseudoTextSize.width / 2,
      y: joinLobbyGroupComponent.group.height() / 2 - pseudoTextSize.height / 2,
      width: pseudoTextSize.width,
      height: pseudoTextSize.height,
      fontSize: 24,
      verticalAlign: "middle",
      padding: 2,
    });
    registry.addComponent(pseudoText, pseudoTextComponent);

    const joinLobbyButtonSize = { width: 300, height: 50 };
    const joinLobbyButton = registry.spawnEntity();
    const joinLobbyButtonComponent = new RectComponent(joinLobbyGroupComponent.group, {
      x: joinLobbyGroupComponent.group.width() / 2 - joinLobbyButtonSize.width / 2,
      y:
        joinLobbyGroupComponent.group.height() / 2 -
        joinLobbyButtonSize.height / 2 +
        pseudoTextSize.height +
        20,
      width: joinLobbyButtonSize.width,
      height: joinLobbyButtonSize.height,
      cornerRadius: 10,
      fill: "#1F6B45",
      stroke: "#134e2c",
      strokeWidth: 2,
      shadowEnabled: false,
      shadowOffsetX: 1,
      shadowOffsetY: 1,
      shadowBlur: 2,
    });
    registry.addComponent(joinLobbyButton, joinLobbyButtonComponent);
    joinLobbyButtonComponent.rect.on("mouseover", () => {
      joinLobbyButtonComponent.rect.shadowEnabled(true);
      if (this.stage) this.stage.container().style.cursor = "pointer";
    });
    joinLobbyButtonComponent.rect.on("mouseout", () => {
      joinLobbyButtonComponent.rect.shadowEnabled(false);
      if (this.stage) this.stage.container().style.cursor = "default";
    });
    joinLobbyButtonComponent.rect.on("click", () => {
      if (this.lobbyStatusComponent) {
        this.lobbyStatusComponent.username = pseudoTextComponent.value;
        this.lobbyStatusComponent.action = LobbyAction.JOIN_LOBBY;
      }
    });

    const textJoinLobbyButton = registry.spawnEntity();
    const textJoinLobbyButtonComponent = new TextComponent(joinLobbyGroupComponent.group, {
      text: "Join Lobby",
      x: joinLobbyGroupComponent.group.width() / 2 - joinLobbyButtonSize.width / 2,
      y:
        joinLobbyGroupComponent.group.height() / 2 -
        joinLobbyButtonSize.height / 2 +
        pseudoTextSize.height +
        20,
      width: joinLobbyButtonSize.width,
      height: joinLobbyButtonSize.height,
      fontSize: 24,
      verticalAlign: "middle",
      align: "center",
      fill: "#F5F2E9",
      fontStyle: "bold",
      listening: false,
    });
    registry.addComponent(textJoinLobbyButton, textJoinLobbyButtonComponent);

    return joinLobbyGroupComponent;
  }

  private buildLobbyWidget(registry: Registry, parent: Container): GroupComponent {
    const lobbyGroup = registry.spawnEntity();
    const lobbyGroupComponent = new GroupComponent(parent, {
      x: parent.width(),
      y: 0,
      width: parent.width(),
      height: parent.height(),
    });
    registry.addComponent(lobbyGroup, lobbyGroupComponent);

    const lobbyGroupPadding = 10;
    const playerPadding = 10;
    const GRID_COLS = 2;
    const GRID_ROWS = 2;

    const availableWidth = lobbyGroupComponent.group.width() - lobbyGroupPadding * 2;

    const cellSize = (availableWidth - playerPadding * (GRID_COLS + 1)) / GRID_COLS;

    const gridWidth = cellSize * GRID_COLS + playerPadding * (GRID_COLS + 1);
    const gridHeight = cellSize * GRID_ROWS + playerPadding * (GRID_ROWS + 1);

    const gridX = lobbyGroupPadding;
    const gridY = lobbyGroupPadding;

    const playersBackground = registry.spawnEntity();
    const playersBackgroundComponent = new RectComponent(lobbyGroupComponent.group, {
      x: gridX,
      y: gridY,
      width: gridWidth,
      height: gridHeight,
      fill: "#1F6B45",
      cornerRadius: 5,
    });
    registry.addComponent(playersBackground, playersBackgroundComponent);

    for (let i = 0; i < GRID_COLS * GRID_ROWS; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);

      const newPlayer = registry.spawnEntity();
      const newPlayerBackground = new RectComponent(lobbyGroupComponent.group, {
        x: gridX + playerPadding + col * (cellSize + playerPadding),
        y: gridY + playerPadding + row * (cellSize + playerPadding),
        width: cellSize,
        height: cellSize,
        fill: "#000000",
        cornerRadius: 5,
      });
      registry.addComponent(newPlayer, newPlayerBackground);

      const newPlayerUsername = registry.spawnEntity();
      const newPlayerUsernameTextComponent = new TextComponent(lobbyGroupComponent.group, {
        x: gridX + playerPadding + col * (cellSize + playerPadding),
        y: gridY + playerPadding + row * (cellSize + playerPadding) + (cellSize * 3) / 4,
        width: cellSize,
        height: cellSize / 4,
        fill: "#FFFFFF",
        align: "center",
      });
      this.playerCases.push(newPlayerUsernameTextComponent);
      registry.addComponent(newPlayerUsername, newPlayerUsernameTextComponent);
    }

    const buttonSize = { width: gridWidth, height: 50 };
    const buttonGap = 20;
    const buttonY = gridY + gridHeight + buttonGap;

    const startButton = registry.spawnEntity();
    const startButtonComponent = new RectComponent(lobbyGroupComponent.group, {
      x: gridX,
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
    registry.addComponent(startButton, startButtonComponent);

    startButtonComponent.rect.on("mouseover", () => {
      startButtonComponent.rect.shadowEnabled(true);
      this.stage.container().style.cursor = "pointer";
    });
    startButtonComponent.rect.on("mouseout", () => {
      startButtonComponent.rect.shadowEnabled(false);
      this.stage.container().style.cursor = "default";
    });
    startButtonComponent.rect.on("click", () => {
      if (this.lobbyStatusComponent) this.lobbyStatusComponent.action = LobbyAction.START_GAME;
    });

    const startButtonText = registry.spawnEntity();
    const startButtonTextComponent = new TextComponent(lobbyGroupComponent.group, {
      text: "Start",
      x: gridX,
      y: buttonY,
      width: buttonSize.width,
      height: buttonSize.height,
      fontSize: 24,
      verticalAlign: "middle",
      align: "center",
      fill: "#F5F2E9",
      fontStyle: "bold",
      listening: false,
    });
    registry.addComponent(startButtonText, startButtonTextComponent);

    return lobbyGroupComponent;
  }
}