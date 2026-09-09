import { Scene } from "./Scene";
import { Container, Easings, Group, Layer, Stage, Tween } from "@nanoforge-dev/graphics-2d";
import { Registry } from "@nanoforge-dev/ecs-client";

import { RectComponent } from "../components/renderable/rect.component";
import { TextAreaComponent } from "../components/renderable/textarea.component";
import { GroupComponent } from "../components/renderable/group.component";
import { TextComponent } from "../components/renderable/text.component";
import { SpriteComponent } from "../components/renderable/sprite.component";
import { TransformComponent } from "../components/essentials/transform.component";
import { LobbyAction, LobbyState, LobbyStatusComponent } from "../components/lobby/lobby-status";
import { classForSkin, PLAYER_CLASS_INFO } from "../player-class-catalog";
import { playerId } from "../main";

// One accent color per available skin (player1.png..player3.png - the only ones that share
// player-animations.txt's 216x72 idle/walk/death frame layout; player4.png is a differently
// sized sheet and would render garbled if selected) - reused for the skin carousel's dot
// indicator and the lobby grid's card border so a given skin reads as "the same color"
// everywhere in the menu.
const SKIN_COLORS = ["#D9A441", "#5CA9DC", "#E07856"];
const SKIN_COUNT = SKIN_COLORS.length;
// Native, unscaled frame size shared by every player*.png sheet (player-animations.txt).
const SPRITE_NATIVE_SIZE = 24;

function skinColor(index: number): string {
  return SKIN_COLORS[index] ?? SKIN_COLORS[0] ?? "#D9A441";
}

// Shortest signed distance from `index` to `selected` around a `count`-item ring - e.g. for 3
// skins this always yields exactly one item at -1 (previous), one at 0 (selected) and one at +1
// (next), regardless of which is currently selected, which is what gives the carousel its
// "wrap around" feel instead of the side previews bunching up on one edge.
function carouselOffset(index: number, selected: number, count: number): number {
  let raw = ((index - selected) % count) + count;
  raw %= count;
  if (raw > count / 2) raw -= count;
  return raw;
}

const ACCENT = "#D9A441";
const MUTED_TEXT = "#8FBB9B";
const PANEL_TEXT = "#F5F2E9";
const PANEL_BG = "#104522";
const INSET_BG = "#0B2E1A";
const BUTTON_BG = "#1F6B45";
const BUTTON_BORDER = "#5E8C61";

const PANEL_SIZE = { width: 500, height: 560 };

// Local (join-widget-space) layout of the skin carousel - shared by creation and by the
// per-frame tick that slides/scales the preview sprites.
const CAROUSEL_CENTER_Y = 196;
const CAROUSEL_SPACING = 110;
const CAROUSEL_SELECTED_SCALE = 3.5;
const CAROUSEL_SIDE_SCALE = 2;
const CAROUSEL_SELECTED_OPACITY = 1;
const CAROUSEL_SIDE_OPACITY = 0.35;
// Exponential smoothing factor applied each tick (higher = snappier) - gives the carousel its
// slide/grow motion instead of the previews jumping straight to their new slot.
const CAROUSEL_EASE = 0.22;

const LOBBY_PREVIEW_SCALE = 2.5;

// Side panels flanking the join/lobby panel - story left, rules+keybinds right. Only drawn when
// the window is wide enough for both to sit fully on screen next to the (fixed-position, never
// itself resized) main panel; on a narrow window they're skipped rather than drawn cramped or
// off-screen, since this scene doesn't handle window resize at all (see `background`'s own
// window.innerWidth/innerHeight snapshot in load()).
const SIDE_PANEL_WIDTH = 260;
const SIDE_PANEL_GAP = 30;
const SIDE_PANEL_PADDING = 20;

const STORY_PARAGRAPHS = [
  "Three weeks after the outbreak, the cities are gone. What's left of the response teams held wherever they could dig in - an old trade depot, walled in on the fly, is yours now.",
  "Every night the horde finds the walls. Every lull between waves is spent scavenging, rebuilding, and spending whatever gold you looted on better guns.",
  "Nobody is coming to relieve you. Hold the depot. Survive the waves.",
];

const RULES = [
  "Squad up with up to 4 survivors in one lobby.",
  "Zombies attack in escalating waves, with a cooldown between each to prepare.",
  "Kill zombies or crack open loot crates to earn gold.",
  "Spend gold at the shop on weapons, ammo, walls and towers.",
  "Walls and towers slow and block the horde - place them to protect the depot.",
  "Downed? A teammate can revive you by holding E next to you.",
];

const KEYBINDS: { key: string; description: string }[] = [
  { key: "WASD", description: "Move" },
  { key: "Mouse", description: "Aim" },
  { key: "LMB", description: "Shoot" },
  { key: "R", description: "Reload" },
  { key: "E", description: "Hold near a downed teammate to revive" },
  { key: "B", description: "Toggle build mode" },
];

// Cheap line-count estimate (no dynamic reflow measurement available before the Text node is
// actually laid out by Konva) used purely to size each side panel's background/spacing ahead of
// time - not pixel-perfect, but close enough for menu copy at these widths/font sizes.
function estimateWrappedHeight(
  text: string,
  width: number,
  fontSize: number,
  lineHeight = 1.4,
): number {
  const avgCharWidth = fontSize * 0.55;
  const charsPerLine = Math.max(1, Math.floor(width / avgCharWidth));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return lines * fontSize * lineHeight;
}

interface CarouselItem {
  sprite: SpriteComponent;
  transform: TransformComponent;
  currentLocalX: number;
  currentScale: number;
  currentOpacity: number;
}

interface LobbySlot {
  card: RectComponent;
  frame: RectComponent;
  previews: SpriteComponent[];
  previewTransforms: TransformComponent[];
  username: TextComponent;
  localCenterX: number;
  localTopY: number;
}

export class MenuScene implements Scene {
  readonly name = "menu";
  layer: Layer | undefined;
  private stage!: Stage;

  private lobbyStatusComponent: LobbyStatusComponent | undefined;

  private joinLobbyGroup: Group | undefined;
  private lobbyGroup: Group | undefined;
  // Absolute (layer-space) position of the never-moving outer panel - the join/lobby widgets
  // slide inside it, but sprite entities are laid out by the ECS in layer space (see
  // sprite.system.ts), not Konva-parented to those groups, so every per-frame sprite reposition
  // starts from this plus the relevant group's own (possibly still-tweening) x/y.
  private panelOrigin = { x: 0, y: 0 };

  private menu: "User" | "Lobby" = "User";
  private joinErrorText: TextComponent | undefined;
  // TextAreaComponent isn't a Konva node - it backs the input with a real DOM <textarea>
  // appended to document.body (Konva can't natively handle text entry), so neither
  // registry.clearEntities() nor stage.clear() (both run by SceneManager.switchTo) ever remove
  // it. Has to be destroyed explicitly here, or it lingers on screen - still showing whatever was
  // typed - straight through into the game.
  private usernameInput: TextAreaComponent | undefined;

  private selectedSkinIndex = 0;
  private carouselSkins: CarouselItem[] = [];
  private skinCaption: TextComponent | undefined;
  private skinDots: RectComponent[] = [];
  private classCaption: TextComponent | undefined;
  private lastWheelAt = 0;

  private playerCountText: TextComponent | undefined;
  private lobbySlots: LobbySlot[] = [];

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

    const mainWidgetGroup = registry.spawnEntity();
    const mainWidgetGroupComponent = new GroupComponent(this.layer, {
      x: window.innerWidth / 2 - PANEL_SIZE.width / 2,
      y: window.innerHeight / 2 - PANEL_SIZE.height / 2,
      width: PANEL_SIZE.width,
      height: PANEL_SIZE.height,
      clip: {
        x: 0,
        y: 0,
        width: PANEL_SIZE.width,
        height: PANEL_SIZE.height,
      },
    });
    registry.addComponent(mainWidgetGroup, mainWidgetGroupComponent);
    this.panelOrigin = {
      x: mainWidgetGroupComponent.group.x(),
      y: mainWidgetGroupComponent.group.y(),
    };

    const mainWidgetBackground = registry.spawnEntity();
    registry.addComponent(
      mainWidgetBackground,
      new RectComponent(mainWidgetGroupComponent.group, {
        x: 0,
        y: 0,
        width: mainWidgetGroupComponent.group.width(),
        height: mainWidgetGroupComponent.group.height(),
        fill: PANEL_BG,
        cornerRadius: 8,
        stroke: BUTTON_BORDER,
        strokeWidth: 1,
      }),
    );

    this.joinLobbyGroup = this.buildJoinLobbyWidget(registry, mainWidgetGroupComponent.group).group;
    this.lobbyGroup = this.buildLobbyWidget(registry, mainWidgetGroupComponent.group).group;

    // Parented straight to the layer, not to either sliding widget group - these stay put (and
    // stay visible) across the join screen and the lobby the same way panelOrigin's outer panel
    // does, giving new players the story/rules/keybinds regardless of which screen they're on.
    this.buildInfoPanels(registry);
  }

  unload(): void {
    this.layer?.destroy();
    this.usernameInput?.destroy();
  }

  tick(registry: Registry) {
    const entities: { LobbyStatusComponent: LobbyStatusComponent }[] = registry.getZipper([
      LobbyStatusComponent,
    ]);
    const firstLobbyStatus = entities[0];

    if (!firstLobbyStatus) return;

    if (this.joinErrorText) {
      this.joinErrorText.text.text(firstLobbyStatus.LobbyStatusComponent.error ?? "");
    }

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

    this.tickCarousel();
    this.tickLobby(firstLobbyStatus.LobbyStatusComponent.players);
  }

  private tickCarousel(): void {
    if (this.carouselSkins.length === 0 || !this.joinLobbyGroup) return;

    // The join widget's -panelWidth slide only clears its own 500px, not the full viewport -
    // these preview sprites aren't Konva-parented to (or clipped by) that group (see
    // panelOrigin's doc comment), so left uncorrected they'd keep sitting on screen, off to the
    // side, for the rest of the time the player spends in the lobby.
    if (this.menu === "Lobby") {
      this.carouselSkins.forEach((item) => item.sprite.sprite?.visible(false));
      return;
    }

    const originX = this.panelOrigin.x + this.joinLobbyGroup.x();
    const originY = this.panelOrigin.y + this.joinLobbyGroup.y();

    this.carouselSkins.forEach((item, index) => {
      const offset = carouselOffset(index, this.selectedSkinIndex, SKIN_COUNT);
      const isSelected = offset === 0;

      const targetLocalX = PANEL_SIZE.width / 2 + offset * CAROUSEL_SPACING;
      const targetScale = isSelected ? CAROUSEL_SELECTED_SCALE : CAROUSEL_SIDE_SCALE;
      const targetOpacity = isSelected ? CAROUSEL_SELECTED_OPACITY : CAROUSEL_SIDE_OPACITY;

      item.currentLocalX += (targetLocalX - item.currentLocalX) * CAROUSEL_EASE;
      item.currentScale += (targetScale - item.currentScale) * CAROUSEL_EASE;
      item.currentOpacity += (targetOpacity - item.currentOpacity) * CAROUSEL_EASE;

      item.transform.x = originX + item.currentLocalX;
      item.transform.y = originY + CAROUSEL_CENTER_Y - (SPRITE_NATIVE_SIZE * item.currentScale) / 2;
      item.sprite.setScale({ x: item.currentScale, y: item.currentScale });
      item.sprite.sprite?.opacity(item.currentOpacity);
    });
  }

  private tickLobby(players: { id: number; username: string; skin: number }[]): void {
    if (this.playerCountText) {
      this.playerCountText.text.text(
        `${players.length} / ${this.lobbySlots.length} players joined`,
      );
    }

    const originX = this.panelOrigin.x + (this.lobbyGroup?.x() ?? 0);
    const originY = this.panelOrigin.y + (this.lobbyGroup?.y() ?? 0);
    // Cycles "Waiting for player" / "." / ".." / "..." - a plain wall-clock read, so every empty
    // slot animates in lockstep without needing any per-slot timer state.
    const waitingDots = ".".repeat(Math.floor(performance.now() / 400) % 4);

    for (let i = 0; i < this.lobbySlots.length; i += 1) {
      const slot = this.lobbySlots[i];
      if (!slot) continue;

      const player = players[i];

      for (let skinIdx = 0; skinIdx < slot.previews.length; skinIdx += 1) {
        const transform = slot.previewTransforms[skinIdx];
        if (!transform) continue;
        transform.x = originX + slot.localCenterX;
        transform.y = originY + slot.localTopY;
        slot.previews[skinIdx]?.sprite?.visible(!!player && (player.skin || 1) - 1 === skinIdx);
      }

      if (player) {
        const isYou = player.id === playerId;
        const skinIndex = Math.min(Math.max((player.skin || 1) - 1, 0), SKIN_COUNT - 1);

        slot.card.rect.stroke(isYou ? ACCENT : skinColor(skinIndex));
        slot.card.rect.strokeWidth(isYou ? 3 : 1);

        slot.username.text.text(isYou ? `${player.username} (You)` : player.username);
        slot.username.text.fill(PANEL_TEXT);
        slot.username.text.fontStyle(isYou ? "bold" : "normal");
        slot.username.text.opacity(1);
      } else {
        slot.card.rect.stroke(BUTTON_BORDER);
        slot.card.rect.strokeWidth(1);

        slot.username.text.text(`Waiting for player${waitingDots}`);
        slot.username.text.fill(MUTED_TEXT);
        slot.username.text.fontStyle("italic");
      }
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
    const group = joinLobbyGroupComponent.group;
    const panelWidth = group.width();

    registry.addComponent(
      registry.spawnEntity(),
      new TextComponent(group, {
        text: "RAID SURVIVAL",
        x: 0,
        y: 34,
        width: panelWidth,
        height: 40,
        fontSize: 32,
        fontStyle: "bold",
        align: "center",
        fill: ACCENT,
        listening: false,
      }),
    );
    registry.addComponent(
      registry.spawnEntity(),
      new TextComponent(group, {
        text: "Co-op zombie defense - survive the waves",
        x: 0,
        y: 78,
        width: panelWidth,
        height: 18,
        fontSize: 13,
        align: "center",
        fill: MUTED_TEXT,
        listening: false,
      }),
    );
    registry.addComponent(
      registry.spawnEntity(),
      new RectComponent(group, {
        x: 50,
        y: 108,
        width: panelWidth - 100,
        height: 1,
        fill: BUTTON_BORDER,
        listening: false,
      }),
    );

    registry.addComponent(
      registry.spawnEntity(),
      new TextComponent(group, {
        text: "CHOOSE YOUR SKIN",
        x: 0,
        y: 126,
        width: panelWidth,
        height: 14,
        fontSize: 12,
        fontStyle: "bold",
        align: "center",
        fill: MUTED_TEXT,
        listening: false,
      }),
    );

    this.buildSkinCarousel(registry, group);

    const fieldWidth = 300;
    const fieldX = panelWidth / 2 - fieldWidth / 2;

    registry.addComponent(
      registry.spawnEntity(),
      new TextComponent(group, {
        text: "YOUR NAME",
        x: fieldX,
        y: 294,
        width: fieldWidth,
        height: 14,
        fontSize: 12,
        fontStyle: "bold",
        fill: MUTED_TEXT,
        listening: false,
      }),
    );

    const pseudoTextSize = { width: fieldWidth, height: 42 };
    const pseudoTextY = 314;
    registry.addComponent(
      registry.spawnEntity(),
      new RectComponent(group, {
        x: fieldX,
        y: pseudoTextY,
        width: pseudoTextSize.width,
        height: pseudoTextSize.height,
        fill: "#FFFFFF",
        cornerRadius: 6,
      }),
    );
    const pseudoText = registry.spawnEntity();
    const pseudoTextComponent = new TextAreaComponent(group, {
      text: "Player" + Math.floor(Math.random() * 10000).toString(),
      x: fieldX,
      y: pseudoTextY,
      width: pseudoTextSize.width,
      height: pseudoTextSize.height,
      fontSize: 18,
      verticalAlign: "middle",
      padding: 8,
    });
    registry.addComponent(pseudoText, pseudoTextComponent);
    this.usernameInput = pseudoTextComponent;

    const joinLobbyButtonSize = { width: fieldWidth, height: 54 };
    const joinLobbyButtonY = pseudoTextY + pseudoTextSize.height + 24;
    const joinLobbyButton = registry.spawnEntity();
    const joinLobbyButtonComponent = new RectComponent(group, {
      x: fieldX,
      y: joinLobbyButtonY,
      width: joinLobbyButtonSize.width,
      height: joinLobbyButtonSize.height,
      cornerRadius: 10,
      fill: BUTTON_BG,
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
    const textJoinLobbyButtonComponent = new TextComponent(group, {
      text: "Join Lobby",
      x: fieldX,
      y: joinLobbyButtonY,
      width: joinLobbyButtonSize.width,
      height: joinLobbyButtonSize.height,
      fontSize: 24,
      verticalAlign: "middle",
      align: "center",
      fill: PANEL_TEXT,
      fontStyle: "bold",
      listening: false,
    });
    registry.addComponent(textJoinLobbyButton, textJoinLobbyButtonComponent);

    const joinErrorTextEntity = registry.spawnEntity();
    this.joinErrorText = new TextComponent(group, {
      text: "",
      x: fieldX,
      y: joinLobbyButtonY + joinLobbyButtonSize.height + 10,
      width: joinLobbyButtonSize.width,
      height: 20,
      fontSize: 14,
      align: "center",
      fill: "#E88686",
      listening: false,
    });
    registry.addComponent(joinErrorTextEntity, this.joinErrorText);

    registry.addComponent(
      registry.spawnEntity(),
      new TextComponent(group, {
        text: "Up to 4 players per raid - anyone in the squad can hit Start once you're ready.",
        x: 40,
        y: group.height() - 40,
        width: panelWidth - 80,
        height: 32,
        fontSize: 11,
        align: "center",
        fill: MUTED_TEXT,
        wrap: "word",
        listening: false,
      }),
    );

    return joinLobbyGroupComponent;
  }

  private buildSkinCarousel(registry: Registry, group: Container): void {
    const layer = this.layer;
    if (!layer) return;
    const panelWidth = group.width();

    // Big invisible hit area over the whole carousel row - lets a trackpad/mouse-wheel "scroll"
    // through skins, in addition to the arrow buttons and dots below.
    const wheelZone = new RectComponent(group, {
      x: 0,
      y: CAROUSEL_CENTER_Y - 60,
      width: panelWidth,
      height: 120,
      fill: "#000000",
      opacity: 0.001,
    });
    registry.addComponent(registry.spawnEntity(), wheelZone);
    wheelZone.rect.on("wheel", (e) => {
      e.evt.preventDefault();
      const now = performance.now();
      if (now - this.lastWheelAt < 250) return;
      const delta = Math.abs(e.evt.deltaX) > Math.abs(e.evt.deltaY) ? e.evt.deltaX : e.evt.deltaY;
      if (Math.abs(delta) < 1) return;
      this.lastWheelAt = now;
      selectSkin(this.selectedSkinIndex + (delta > 0 ? 1 : -1));
    });

    for (let i = 0; i < SKIN_COUNT; i += 1) {
      const entity = registry.spawnEntity();
      const transform = new TransformComponent(
        this.panelOrigin.x + panelWidth / 2,
        this.panelOrigin.y + CAROUSEL_CENTER_Y,
      );
      registry.addComponent(entity, transform);
      const sprite = new SpriteComponent(`player${i + 1}.png`, {
        layer,
        animationsKey: "player-animations.txt",
        scale: { x: CAROUSEL_SIDE_SCALE, y: CAROUSEL_SIDE_SCALE },
      });
      registry.addComponent(entity, sprite);

      this.carouselSkins.push({
        sprite,
        transform,
        currentLocalX: panelWidth / 2,
        currentScale: CAROUSEL_SIDE_SCALE,
        currentOpacity: CAROUSEL_SIDE_OPACITY,
      });
    }

    const arrowSize = 36;
    const arrowY = CAROUSEL_CENTER_Y - arrowSize / 2;

    const buildArrow = (label: string, x: number, onClick: () => void) => {
      const rectComponent = new RectComponent(group, {
        x,
        y: arrowY,
        width: arrowSize,
        height: arrowSize,
        cornerRadius: 8,
        fill: BUTTON_BG,
        stroke: BUTTON_BORDER,
        strokeWidth: 2,
      });
      registry.addComponent(registry.spawnEntity(), rectComponent);
      rectComponent.rect.on("mouseover", () => {
        if (this.stage) this.stage.container().style.cursor = "pointer";
      });
      rectComponent.rect.on("mouseout", () => {
        if (this.stage) this.stage.container().style.cursor = "default";
      });
      rectComponent.rect.on("click", onClick);

      registry.addComponent(
        registry.spawnEntity(),
        new TextComponent(group, {
          text: label,
          x,
          y: arrowY,
          width: arrowSize,
          height: arrowSize,
          fontSize: 20,
          fontStyle: "bold",
          align: "center",
          verticalAlign: "middle",
          fill: PANEL_TEXT,
          listening: false,
        }),
      );
    };

    buildArrow("<", panelWidth / 2 - 150 - arrowSize / 2, () =>
      selectSkin(this.selectedSkinIndex - 1),
    );
    buildArrow(">", panelWidth / 2 + 150 - arrowSize / 2, () =>
      selectSkin(this.selectedSkinIndex + 1),
    );

    this.skinCaption = new TextComponent(group, {
      text: "",
      x: 0,
      y: 248,
      width: panelWidth,
      height: 16,
      fontSize: 13,
      fontStyle: "bold",
      align: "center",
      fill: ACCENT,
      listening: false,
    });
    registry.addComponent(registry.spawnEntity(), this.skinCaption);

    const dotSize = 8;
    const dotGap = 10;
    const dotsWidth = SKIN_COUNT * dotSize + (SKIN_COUNT - 1) * dotGap;
    const dotsStartX = panelWidth / 2 - dotsWidth / 2;
    for (let i = 0; i < SKIN_COUNT; i += 1) {
      const dotX = dotsStartX + i * (dotSize + dotGap);
      const dotComponent = new RectComponent(group, {
        x: dotX,
        y: 266,
        width: dotSize,
        height: dotSize,
        cornerRadius: dotSize / 2,
        fill: BUTTON_BORDER,
      });
      registry.addComponent(registry.spawnEntity(), dotComponent);
      dotComponent.rect.on("mouseover", () => {
        if (this.stage) this.stage.container().style.cursor = "pointer";
      });
      dotComponent.rect.on("mouseout", () => {
        if (this.stage) this.stage.container().style.cursor = "default";
      });
      const dotIndex = i;
      dotComponent.rect.on("click", () => selectSkin(dotIndex));
      this.skinDots.push(dotComponent);
    }

    // Below the dots - each skin IS a class pick (server/player-class-catalog.ts), so this is
    // what actually tells a player what they're choosing, not just cosmetics.
    this.classCaption = new TextComponent(group, {
      text: "",
      x: 0,
      y: 284,
      width: panelWidth,
      height: 30,
      fontSize: 11,
      align: "center",
      fill: PANEL_TEXT,
      listening: false,
    });
    registry.addComponent(registry.spawnEntity(), this.classCaption);

    const selectSkin = (index: number) => {
      this.selectedSkinIndex = ((index % SKIN_COUNT) + SKIN_COUNT) % SKIN_COUNT;
      if (this.lobbyStatusComponent) this.lobbyStatusComponent.skin = this.selectedSkinIndex + 1;
      this.skinCaption?.text.text(`Skin ${this.selectedSkinIndex + 1} / ${SKIN_COUNT}`);
      this.skinDots.forEach((dot, i) => {
        dot.rect.fill(i === this.selectedSkinIndex ? skinColor(i) : BUTTON_BORDER);
      });
      const classInfo = PLAYER_CLASS_INFO[classForSkin(this.selectedSkinIndex + 1)];
      this.classCaption?.text.text(`${classInfo.name} - ${classInfo.description}`);
    };

    selectSkin(this.selectedSkinIndex);
  }

  private buildLobbyWidget(registry: Registry, parent: Container): GroupComponent {
    const layer = this.layer;
    const lobbyGroup = registry.spawnEntity();
    const lobbyGroupComponent = new GroupComponent(parent, {
      x: parent.width(),
      y: 0,
      width: parent.width(),
      height: parent.height(),
    });
    registry.addComponent(lobbyGroup, lobbyGroupComponent);
    if (!layer) return lobbyGroupComponent;
    const group = lobbyGroupComponent.group;
    const panelWidth = group.width();

    registry.addComponent(
      registry.spawnEntity(),
      new TextComponent(group, {
        text: "LOBBY",
        x: 0,
        y: 24,
        width: panelWidth,
        height: 34,
        fontSize: 26,
        fontStyle: "bold",
        align: "center",
        fill: ACCENT,
        listening: false,
      }),
    );

    this.playerCountText = new TextComponent(group, {
      text: "0 / 4 players joined",
      x: 0,
      y: 62,
      width: panelWidth,
      height: 18,
      fontSize: 13,
      align: "center",
      fill: MUTED_TEXT,
      listening: false,
    });
    registry.addComponent(registry.spawnEntity(), this.playerCountText);

    const GRID_COLS = 2;
    const GRID_ROWS = 2;
    const cellSize = 130;
    const cellGap = 16;

    const gridWidth = cellSize * GRID_COLS + cellGap * (GRID_COLS + 1);
    const gridHeight = cellSize * GRID_ROWS + cellGap * (GRID_ROWS + 1);
    const gridX = panelWidth / 2 - gridWidth / 2;
    const gridY = 96;

    for (let i = 0; i < GRID_COLS * GRID_ROWS; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);

      const cellX = gridX + cellGap + col * (cellSize + cellGap);
      const cellY = gridY + cellGap + row * (cellSize + cellGap);

      const cardComponent = new RectComponent(group, {
        x: cellX,
        y: cellY,
        width: cellSize,
        height: cellSize,
        fill: INSET_BG,
        stroke: BUTTON_BORDER,
        strokeWidth: 1,
        cornerRadius: 10,
      });
      registry.addComponent(registry.spawnEntity(), cardComponent);

      const frameSize = 70;
      const frameX = cellX + (cellSize - frameSize) / 2;
      const frameY = cellY + 12;

      const frameComponent = new RectComponent(group, {
        x: frameX,
        y: frameY,
        width: frameSize,
        height: frameSize,
        fill: "#173423",
        stroke: BUTTON_BORDER,
        strokeWidth: 1,
        cornerRadius: frameSize / 2,
        listening: false,
      });
      registry.addComponent(registry.spawnEntity(), frameComponent);

      const spriteSize = SPRITE_NATIVE_SIZE * LOBBY_PREVIEW_SCALE;
      const localCenterX = frameX + frameSize / 2;
      const localTopY = frameY + (frameSize - spriteSize) / 2;

      const previews: SpriteComponent[] = [];
      const previewTransforms: TransformComponent[] = [];
      for (let skinIdx = 0; skinIdx < SKIN_COUNT; skinIdx += 1) {
        const previewEntity = registry.spawnEntity();
        const transform = new TransformComponent(
          this.panelOrigin.x + localCenterX,
          this.panelOrigin.y + localTopY,
        );
        registry.addComponent(previewEntity, transform);
        const sprite = new SpriteComponent(`player${skinIdx + 1}.png`, {
          layer,
          animationsKey: "player-animations.txt",
          scale: { x: LOBBY_PREVIEW_SCALE, y: LOBBY_PREVIEW_SCALE },
        });
        registry.addComponent(previewEntity, sprite);
        previews.push(sprite);
        previewTransforms.push(transform);
      }

      const usernameComponent = new TextComponent(group, {
        text: "Waiting for player",
        x: cellX,
        y: frameY + frameSize + 8,
        width: cellSize,
        height: 16,
        fontSize: 12,
        fontStyle: "italic",
        align: "center",
        fill: MUTED_TEXT,
        listening: false,
      });
      registry.addComponent(registry.spawnEntity(), usernameComponent);

      this.lobbySlots.push({
        card: cardComponent,
        frame: frameComponent,
        previews,
        previewTransforms,
        username: usernameComponent,
        localCenterX,
        localTopY,
      });
    }

    const buttonSize = { width: gridWidth, height: 54 };
    const buttonGap = 24;
    const buttonY = gridY + gridHeight + buttonGap;

    const startButton = registry.spawnEntity();
    const startButtonComponent = new RectComponent(group, {
      x: gridX,
      y: buttonY,
      width: buttonSize.width,
      height: buttonSize.height,
      cornerRadius: 10,
      fill: BUTTON_BG,
      stroke: BUTTON_BORDER,
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
      this.stage.container().style.cursor = "default";
    });

    const startButtonText = registry.spawnEntity();
    const startButtonTextComponent = new TextComponent(group, {
      text: "Start",
      x: gridX,
      y: buttonY,
      width: buttonSize.width,
      height: buttonSize.height,
      fontSize: 24,
      verticalAlign: "middle",
      align: "center",
      fill: PANEL_TEXT,
      fontStyle: "bold",
      listening: false,
    });
    registry.addComponent(startButtonText, startButtonTextComponent);

    registry.addComponent(
      registry.spawnEntity(),
      new TextComponent(group, {
        text: "Anyone in the squad can start the raid.",
        x: 40,
        y: buttonY + buttonSize.height + 12,
        width: panelWidth - 80,
        height: 16,
        fontSize: 11,
        align: "center",
        fill: MUTED_TEXT,
        listening: false,
      }),
    );

    return lobbyGroupComponent;
  }

  private buildInfoPanels(registry: Registry): void {
    const layer = this.layer;
    if (!layer) return;

    const leftX = this.panelOrigin.x - SIDE_PANEL_GAP - SIDE_PANEL_WIDTH;
    const rightX = this.panelOrigin.x + PANEL_SIZE.width + SIDE_PANEL_GAP;
    // Skip entirely on a window too narrow to fit both panels fully on screen rather than
    // drawing them cramped, overlapping the main panel, or clipped off the edge.
    if (leftX < 12 || rightX + SIDE_PANEL_WIDTH > window.innerWidth - 12) return;

    this.buildStoryPanel(registry, layer, leftX, this.panelOrigin.y);
    this.buildRulesAndKeybindsPanel(registry, layer, rightX, this.panelOrigin.y);
  }

  private buildStoryPanel(registry: Registry, layer: Layer, x: number, y: number): void {
    const contentWidth = SIDE_PANEL_WIDTH - SIDE_PANEL_PADDING * 2;
    const titleAreaHeight = 66;
    const paragraphGap = 14;

    const paragraphHeights = STORY_PARAGRAPHS.map((text) =>
      estimateWrappedHeight(text, contentWidth, 13),
    );
    const contentHeight =
      paragraphHeights.reduce((sum, h) => sum + h, 0) +
      paragraphGap * (STORY_PARAGRAPHS.length - 1);
    const panelHeight = titleAreaHeight + contentHeight + SIDE_PANEL_PADDING;

    registry.addComponent(
      registry.spawnEntity(),
      new RectComponent(layer, {
        x,
        y,
        width: SIDE_PANEL_WIDTH,
        height: panelHeight,
        fill: PANEL_BG,
        cornerRadius: 8,
        stroke: BUTTON_BORDER,
        strokeWidth: 1,
        listening: false,
      }),
    );
    registry.addComponent(
      registry.spawnEntity(),
      new TextComponent(layer, {
        text: "THE STORY",
        x,
        y: y + 20,
        width: SIDE_PANEL_WIDTH,
        height: 20,
        fontSize: 16,
        fontStyle: "bold",
        align: "center",
        fill: ACCENT,
        listening: false,
      }),
    );
    registry.addComponent(
      registry.spawnEntity(),
      new RectComponent(layer, {
        x: x + SIDE_PANEL_PADDING,
        y: y + 46,
        width: SIDE_PANEL_WIDTH - SIDE_PANEL_PADDING * 2,
        height: 1,
        fill: BUTTON_BORDER,
        listening: false,
      }),
    );

    let cursorY = y + titleAreaHeight;
    STORY_PARAGRAPHS.forEach((text, i) => {
      const height = paragraphHeights[i] ?? estimateWrappedHeight(text, contentWidth, 13);
      registry.addComponent(
        registry.spawnEntity(),
        new TextComponent(layer, {
          text,
          x: x + SIDE_PANEL_PADDING,
          y: cursorY,
          width: contentWidth,
          height,
          fontSize: 13,
          lineHeight: 1.4,
          fill: PANEL_TEXT,
          wrap: "word",
          listening: false,
        }),
      );
      cursorY += height + paragraphGap;
    });
  }

  private buildRulesAndKeybindsPanel(registry: Registry, layer: Layer, x: number, y: number): void {
    const contentWidth = SIDE_PANEL_WIDTH - SIDE_PANEL_PADDING * 2;
    const bulletIndent = 16;
    const bulletTextWidth = contentWidth - bulletIndent;
    const titleAreaHeight = 66;
    const bulletGap = 10;
    const sectionGap = 26;
    const keybindRowHeight = 34;

    const ruleHeights = RULES.map((text) => estimateWrappedHeight(text, bulletTextWidth, 12));
    const rulesHeight = ruleHeights.reduce((sum, h) => sum + h, 0) + bulletGap * (RULES.length - 1);
    const keybindsHeight = KEYBINDS.length * keybindRowHeight;
    const panelHeight =
      titleAreaHeight + rulesHeight + sectionGap + 26 + keybindsHeight + SIDE_PANEL_PADDING;

    registry.addComponent(
      registry.spawnEntity(),
      new RectComponent(layer, {
        x,
        y,
        width: SIDE_PANEL_WIDTH,
        height: panelHeight,
        fill: PANEL_BG,
        cornerRadius: 8,
        stroke: BUTTON_BORDER,
        strokeWidth: 1,
        listening: false,
      }),
    );
    registry.addComponent(
      registry.spawnEntity(),
      new TextComponent(layer, {
        text: "RULES",
        x,
        y: y + 20,
        width: SIDE_PANEL_WIDTH,
        height: 20,
        fontSize: 16,
        fontStyle: "bold",
        align: "center",
        fill: ACCENT,
        listening: false,
      }),
    );
    registry.addComponent(
      registry.spawnEntity(),
      new RectComponent(layer, {
        x: x + SIDE_PANEL_PADDING,
        y: y + 46,
        width: contentWidth,
        height: 1,
        fill: BUTTON_BORDER,
        listening: false,
      }),
    );

    let cursorY = y + titleAreaHeight;
    RULES.forEach((text, i) => {
      const height = ruleHeights[i] ?? estimateWrappedHeight(text, bulletTextWidth, 12);
      registry.addComponent(
        registry.spawnEntity(),
        new RectComponent(layer, {
          x: x + SIDE_PANEL_PADDING,
          y: cursorY + 5,
          width: 6,
          height: 6,
          cornerRadius: 3,
          fill: ACCENT,
          listening: false,
        }),
      );
      registry.addComponent(
        registry.spawnEntity(),
        new TextComponent(layer, {
          text,
          x: x + SIDE_PANEL_PADDING + bulletIndent,
          y: cursorY,
          width: bulletTextWidth,
          height,
          fontSize: 12,
          lineHeight: 1.4,
          fill: PANEL_TEXT,
          wrap: "word",
          listening: false,
        }),
      );
      cursorY += height + bulletGap;
    });

    cursorY += sectionGap;
    registry.addComponent(
      registry.spawnEntity(),
      new TextComponent(layer, {
        text: "KEYBINDS",
        x,
        y: cursorY,
        width: SIDE_PANEL_WIDTH,
        height: 20,
        fontSize: 16,
        fontStyle: "bold",
        align: "center",
        fill: ACCENT,
        listening: false,
      }),
    );
    registry.addComponent(
      registry.spawnEntity(),
      new RectComponent(layer, {
        x: x + SIDE_PANEL_PADDING,
        y: cursorY + 26,
        width: contentWidth,
        height: 1,
        fill: BUTTON_BORDER,
        listening: false,
      }),
    );
    cursorY += 26 + 14;

    const keySize = { width: 52, height: 24 };
    KEYBINDS.forEach(({ key, description }) => {
      registry.addComponent(
        registry.spawnEntity(),
        new RectComponent(layer, {
          x: x + SIDE_PANEL_PADDING,
          y: cursorY,
          width: keySize.width,
          height: keySize.height,
          cornerRadius: 6,
          fill: BUTTON_BG,
          stroke: BUTTON_BORDER,
          strokeWidth: 1,
          listening: false,
        }),
      );
      registry.addComponent(
        registry.spawnEntity(),
        new TextComponent(layer, {
          text: key,
          x: x + SIDE_PANEL_PADDING,
          y: cursorY,
          width: keySize.width,
          height: keySize.height,
          fontSize: 11,
          fontStyle: "bold",
          align: "center",
          verticalAlign: "middle",
          fill: PANEL_TEXT,
          listening: false,
        }),
      );
      registry.addComponent(
        registry.spawnEntity(),
        new TextComponent(layer, {
          text: description,
          x: x + SIDE_PANEL_PADDING + keySize.width + 10,
          y: cursorY,
          width: contentWidth - keySize.width - 10,
          height: keySize.height,
          fontSize: 11,
          verticalAlign: "middle",
          fill: MUTED_TEXT,
          wrap: "word",
          listening: false,
        }),
      );
      cursorY += keybindRowHeight;
    });
  }
}
