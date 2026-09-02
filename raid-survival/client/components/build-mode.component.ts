import { Circle, Rect, Shape, Text } from "@nanoforge-dev/graphics-2d";
import { type BuildingType } from "../building-catalog";

export interface BuildBarButton {
  buildingType: BuildingType;
  rect: Rect;
  text: Text;
  costText: Text;
  costIcon: Circle;
}

// Screen-space (hudLayer-local, which is unscaled/unpositioned so local === screen) bounds of
// the whole build bar - build-mode.system.ts checks the cursor against this before treating a
// click as a world-space placement click, so clicking a bar button doesn't also place a
// building on whatever tile happens to be behind it.
export interface ScreenBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Singleton - built once at game start (client/systems/packet-handlers/
// start-game-packet.handler.ts) and owned entirely by build-mode.system.ts from then on.
export class BuildModeComponent {
  name = this.constructor.name;

  active: boolean = false;
  selectedBuildingType: BuildingType | null = null;
  // Edge-detection for level-triggered inputs (isKeyPressed reports "held", not "just pressed") -
  // without these, holding the key/mouse button down would re-fire every single frame.
  wasTogglePressed: boolean = false;
  wasPlaceClickPressed: boolean = false;

  constructor(
    public gridShape: Shape,
    public previewRect: Rect,
    public barButtons: BuildBarButton[],
    public barBounds: ScreenBox,
  ) {}
}

// * Required to generate code
export default BuildModeComponent.name;
