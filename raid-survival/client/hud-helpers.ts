import { Circle, Layer } from "@nanoforge-dev/graphics-2d";

// A small gold coin icon - no coin/currency sprite exists anywhere in this game's art (checked
// ui.png/objects.png/weapons.png exhaustively), so this is drawn directly instead of cropped.
// Plain function, not a component - nothing needs to look this node up later, same category as
// build-mode.system.ts's gridShape/previewRect.
const COIN_FILL = "#F4C74C";
const COIN_STROKE = "#8A6A1E";

export function addCoinIcon(layer: Layer, x: number, y: number, radius: number): Circle {
  const coin = new Circle({
    x: x + radius,
    y: y + radius,
    radius,
    fill: COIN_FILL,
    stroke: COIN_STROKE,
    strokeWidth: 1.5,
    listening: false,
  });
  layer.add(coin);
  return coin;
}
