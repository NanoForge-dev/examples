import type { AssetContext } from "@nanoforge-dev/common";
import type { ShapeConfig } from "@nanoforge-dev/graphics-2d";

const images = new Map<string, HTMLImageElement>();

/**
 * The fill of a shape of `width` by `height` pixels showing the image at `path` (an asset path
 * such as `/textures/hero.png`, found in `assets`) stretched over it. Without an image, until it
 * is loaded, or when there is no asset at `path`, the shape is filled with its color.
 *
 * @param centered - Whether the shape's origin is its center (a circle) instead of its top-left
 * corner (a rectangle).
 */
export const imageFill = (
  assets: AssetContext,
  path: string,
  width: number,
  height: number,
  centered = false,
): ShapeConfig => {
  if (!path) return { fillPriority: "color", fillPatternImage: undefined };
  let image = images.get(path);
  if (!image) {
    image = document.createElement("img");
    try {
      image.src = assets.getAsset(path).path;
    } catch (error) {
      // Once per path, not every frame: the shape keeps its color.
      console.warn(`No image at "${path}":`, error);
    }
    images.set(path, image);
  }
  if (!image.naturalWidth) return { fillPriority: "color", fillPatternImage: undefined };
  return {
    fillPriority: "pattern",
    fillPatternImage: image,
    fillPatternRepeat: "no-repeat",
    fillPatternScaleX: width / image.naturalWidth,
    fillPatternScaleY: height / image.naturalHeight,
    fillPatternOffsetX: centered ? image.naturalWidth / 2 : 0,
    fillPatternOffsetY: centered ? image.naturalHeight / 2 : 0,
  };
};
