import { Circle, Rect, Shape, Text } from "@nanoforge-dev/graphics-2d";
import { type BuildingType } from "@raid-survival/shared/building-catalog";

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

/**
 * The build mode of the local player: the grid, the placement preview, the build bar, the destroy
 * button and the zoom buttons, all Konva nodes made by `buildWorld`. Driven by `buildModeSystem`.
 *
 * @component
 * @side client
 */
export class BuildModeComponent {
  name = "BuildModeComponent";

  active: boolean = false;
  selectedBuildingType: BuildingType | null = null;
  destroyMode: boolean = false;
  // Edge-detection for level-triggered inputs (isKeyPressed reports "held", not "just pressed").
  wasTogglePressed: boolean = false;
  wasPlaceClickPressed: boolean = false;

  constructor(
    /** The tile grid drawn over the map. */
    public gridShape: Shape,
    /** The placement preview under the cursor. */
    public previewRect: Rect,
    /** The range of the tower being placed. */
    public rangeCircle: Circle,
    /** The buttons of the build bar, one per building. */
    public barButtons: BuildBarButton[],
    /** The button of the destroy mode. */
    public destroyButton: DestroyButton,
    /** Screen box of the build bar, where a click is not a placement. */
    public barBounds: ScreenBox,
    // One Shape draws every built tower's range circle at once, reading `towerRangeCenters` in
    // its sceneFunc - avoids per-tower cleanup on destroy.
    /** Draws the range of every built tower. */
    public towerRangeCircles: Shape,
    // Same array instance towerRangeCircles' sceneFunc closure reads; build-mode.system.ts
    // refills it each tick. Konva can invoke sceneFunc off-tick during its own render loop, so
    // this must stay a plain array read, not a live registry query.
    /** Centers of the built towers, read by `towerRangeCircles`. */
    public towerRangeCenters: { x: number; y: number }[],
    /** The zoom in button. */
    public zoomInButton: ZoomButton,
    /** The zoom out button. */
    public zoomOutButton: ZoomButton,
    /** Screen box of the zoom buttons. */
    public zoomBounds: ScreenBox,
    /** Zoom applied now: eases toward `targetZoomLevel` each tick, so the camera doesn't jump. */
    public zoomLevel: number = 1,
    /** Zoom asked by the zoom buttons. */
    public targetZoomLevel: number = 1,
  ) {}
}
