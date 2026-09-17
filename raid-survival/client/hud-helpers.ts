import { Circle, Layer } from "@nanoforge-dev/graphics-2d";

// No coin/currency sprite exists in this game's art, so it's drawn directly instead of cropped.
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
