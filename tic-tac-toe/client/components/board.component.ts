import { type EditorComponentManifest } from "@nanoforge-dev/ecs-client";
import {Circle, Line, Rect} from "@nanoforge-dev/graphics-2d";
import {layer} from "../main";

export enum CellState {
  Empty,
  X,
  O
}

export class Background {
  name = this.constructor.name;
  bg: Rect;

  constructor(width: number, height: number) {
    this.bg = new Rect({
      x: 0,
      y: 0,
      width: width,
      height: height,
      fill: "#161625"
    });
    layer.add(this.bg);
  }
}

export class Board {
  name = this.constructor.name;
  bg: Rect;

  constructor(x: number, y: number, size: number) {
    this.bg = new Rect({
      cornerRadius: 15,
      x: x,
      y: y,
      width: size,
      height: size,
      fill: "#4C2A85"
    })
    layer.add(this.bg);
  }
}

export class Cell {
  name = this.constructor.name;
  rect: Rect;
  hover: boolean = false;
  pressed: boolean = false;
  state: CellState = CellState.Empty;
  row: number;
  col: number;
  x: number;
  y: number;
  size: number;

  constructor(row: number, col: number, x: number, y: number, size: number) {
    this.rect = new Rect({
      cornerRadius: 15,
      x: x,
      y: y,
      width: size,
      height: size,
      fill: "#23233A"
    });

    this.row = row;
    this.col = col;
    this.x = x;
    this.y = y;
    this.size = size;

    this.rect.on('mouseover', (e) => {
      if (this.state == CellState.Empty) e.target.getStage()!.container().style.cursor = 'pointer';
      this.hover = true;
    });

    this.rect.on('mouseout', (e) => {
      e.target.getStage()!.container().style.cursor = 'default';
      this.hover = false;
    });

    this.rect.on('mousedown', () => {
      this.pressed = true;
    })

    this.rect.on('mouseup', () => {
      this.pressed = false;
    })

    layer.add(this.rect);
  }
}

export class Marker {
  name = this.constructor.name;
  isOwnedByFirstPlayer: boolean;

  constructor(x: number, y: number, size: number, isOwnedByFirstPlayer: boolean = false) {
    this.isOwnedByFirstPlayer = isOwnedByFirstPlayer;

    const padding = size * 0.15;
    const radius = size / 2;

    if (isOwnedByFirstPlayer) {
      const line1 = new Line({
        points: [
          x + padding, y + padding,
          x + size - padding, y + size - padding,
        ],
        stroke: "#f87171",
        strokeWidth: 8,
        lineCap: "round"
      });
      const line2 = new Line({
        points: [
          x + size - padding, y + padding,
          x + padding, y + size - padding
        ],
        stroke: "#f87171",
        strokeWidth: 8,
        lineCap: "round"
      });
      layer.add(line1);
      layer.add(line2);
    } else {
      const marker = new Circle({
        x: x + radius,
        y: y + radius,
        radius: radius - padding,
        fill: "#C084FC"
      });
      layer.add(marker);
    }
  }
}

// * Required to generate code
export default Board.name;