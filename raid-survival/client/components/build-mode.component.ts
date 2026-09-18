import { Circle, Rect, Shape, Text } from "@nanoforge-dev/graphics-2d";
import { type BuildingType } from "../building-catalog";

export interface BuildBarButton {
  buildingType: BuildingType;
  rect: Rect;
  text: Text;
  costText: Text;
  costIcon: Circle;
}

// Mutually exclusive with selecting a BuildingType to place - see build-mode.system.ts.
export interface DestroyButton {
  rect: Rect;
  text: Text;
}

export interface ZoomButton {
  rect: Rect;
  text: Text;
}

// Screen-space (hudLayer-local) bounds used to guard against a UI click also registering as a
// world-space placement/destroy click on whatever tile is behind it.
export interface ScreenBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class BuildModeComponent {
  name = this.constructor.name;

  active: boolean = false;
  selectedBuildingType: BuildingType | null = null;
  destroyMode: boolean = false;
  // Edge-detection for level-triggered inputs (isKeyPressed reports "held", not "just pressed").
  wasTogglePressed: boolean = false;
  wasPlaceClickPressed: boolean = false;

  constructor(
    public gridShape: Shape,
    public previewRect: Rect,
    public rangeCircle: Circle,
    public barButtons: BuildBarButton[],
    public destroyButton: DestroyButton,
    public barBounds: ScreenBox,
    // One Shape draws every built tower's range circle at once, reading `towerRangeCenters` in
    // its sceneFunc - avoids per-tower cleanup on destroy.
    public towerRangeCircles: Shape,
    // Same array instance towerRangeCircles' sceneFunc closure reads; build-mode.system.ts
    // refills it each tick. Konva can invoke sceneFunc off-tick during its own render loop, so
    // this must stay a plain array read, not a live registry query.
    public towerRangeCenters: { x: number; y: number }[],
    public zoomInButton: ZoomButton,
    public zoomOutButton: ZoomButton,
    public zoomBounds: ScreenBox,
    // Live zoom multiplier - eases toward targetZoomLevel each tick rather than snapping, so
    // camera-follow doesn't jump.
    public zoomLevel: number = 1,
    public targetZoomLevel: number = 1,
  ) {}
}

// * Required to generate code
export default BuildModeComponent.name;
