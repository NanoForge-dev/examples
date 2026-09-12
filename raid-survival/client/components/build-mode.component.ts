import { Circle, Rect, Shape, Text } from "@nanoforge-dev/graphics-2d";
import { type BuildingType } from "../building-catalog";

export interface BuildBarButton {
  buildingType: BuildingType;
  rect: Rect;
  text: Text;
  costText: Text;
  costIcon: Circle;
}

// The build bar's extra "Destroy" button - mutually exclusive with selecting a BuildingType to
// place (see build-mode.system.ts): while active, clicking an existing building refunds 50% of
// its value and removes it instead of placing anything new.
export interface DestroyButton {
  rect: Rect;
  text: Text;
}

// A "+"/"-" screen-space camera zoom control, top-right - start-game-packet.handler.ts's click
// handlers clamp BuildModeComponent.targetZoomLevel between MIN_ZOOM/MAX_ZOOM; build-mode.
// system.ts eases the live zoomLevel toward it every tick.
export interface ZoomButton {
  rect: Rect;
  text: Text;
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
  // Toggled by clicking `destroyButton` (mutually exclusive with selectedBuildingType - selecting
  // one clears the other). While true, a placement click instead looks for an existing building
  // under the cursor and requests its removal.
  destroyMode: boolean = false;
  // Edge-detection for level-triggered inputs (isKeyPressed reports "held", not "just pressed") -
  // without these, holding the key/mouse button down would re-fire every single frame.
  wasTogglePressed: boolean = false;
  wasPlaceClickPressed: boolean = false;

  constructor(
    public gridShape: Shape,
    public previewRect: Rect,
    // Shown centered on previewRect only while the tower build-bar entry is selected - see
    // build-mode.system.ts.
    public rangeCircle: Circle,
    public barButtons: BuildBarButton[],
    public destroyButton: DestroyButton,
    public barBounds: ScreenBox,
    // One Shape drawing every ALREADY-BUILT tower's range circle at once (its sceneFunc reads
    // `towerRangeCenters` below on every Konva draw) - a single node rather than one Circle per
    // tower so a destroyed tower's circle never needs its own cleanup in kill-packet.handler.ts,
    // and only one moveToTop() is needed alongside gridShape/previewRect's own.
    public towerRangeCircles: Shape,
    // The SAME array instance `towerRangeCircles`'s sceneFunc closure iterates - build-mode.
    // system.ts refills it (length = 0, then push) from live Building/TransformComponent state
    // once per tick. Konva can invoke sceneFunc from its own render loop, off this system's tick
    // (e.g. a batched redraw after .visible()/.moveToTop()) - reading a plain array the closure
    // already has a reference to is safe there; calling registry.getZipper() directly from inside
    // a Konva draw callback would not be.
    public towerRangeCenters: { x: number; y: number }[],
    public zoomInButton: ZoomButton,
    public zoomOutButton: ZoomButton,
    // Screen-space bounds covering both zoom buttons together - same role as `barBounds` above:
    // build-mode.system.ts checks the cursor against this before treating a click as a world-space
    // placement click, so clicking "+"/"-" doesn't also place/destroy a building on the map tile
    // behind them.
    public zoomBounds: ScreenBox,
    // The LIVE, currently-applied zoom multiplier - build-mode.system.ts eases this toward
    // `targetZoomLevel` a little every tick (never snaps straight to it) before writing
    // BASE_WORLD_SCALE * zoomLevel onto the world layer's scale. cameraFollowSystem reads that
    // same layer's live scale back out for its own centering/clamping math every tick too, so a
    // zoomLevel that only ever moves a little per frame is what keeps the camera from jumping.
    public zoomLevel: number = 1,
    // What the "+"/"-" buttons actually change (clamped to MIN_ZOOM/MAX_ZOOM) - zoomLevel eases
    // toward this rather than snapping to it, so a click doesn't produce a big instant jump.
    public targetZoomLevel: number = 1,
  ) {}
}

// * Required to generate code
export default BuildModeComponent.name;
