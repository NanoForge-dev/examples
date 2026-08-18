import { type Context, NfFile } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Graphics2DLibrary, Sprite } from "@nanoforge-dev/graphics-2d";
import { PositionComponent } from "../components/position.component";
import { RenderableComponent } from "../components/renderable.component";
import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";

type Animations = Record<string, number[]>;

const imageCache = new Map<string, HTMLImageElement>();
const imageLoading = new Map<string, Promise<HTMLImageElement>>();

function loadImage(path: string): Promise<HTMLImageElement | undefined> {
  if (imageCache.has(path)) return Promise.resolve(imageCache.get(path));
  if (imageLoading.has(path)) return Promise.resolve(imageLoading.get(path));

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      imageCache.set(path, image);
      resolve(image);
    };
    image.onerror = reject;
    image.src = path;
  });

  imageLoading.set(path, promise);
  return promise;
}

const animationsCache = new Map<string, Animations>();
const animationsLoading = new Map<string, Promise<Animations>>();

function loadAnimations(file: NfFile): Promise<Animations | undefined> {
  if (animationsCache.has(file.path)) return Promise.resolve(animationsCache.get(file.path));
  if (animationsLoading.has(file.path)) return Promise.resolve(animationsLoading.get(file.path));

  const promise = file.text().then((raw) => {
    const result: Animations = {};

    raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .forEach((line) => {
        const [name, framesStr] = line.split(":").map((s) => s.trim());
        if (!name || !framesStr) throw new Error(`${name} failed to parse animations`);

        const frames = framesStr
          .split(" ")
          .filter((f) => f.length > 0)
          .flatMap((frame) => frame.split(",").map(Number));

        result[name] = frames;
      });

    animationsCache.set(file.path, result);
    return result;
  });

  animationsLoading.set(file.path, promise);
  return promise;
}


const spriteCache = new Map<number, Sprite>();
const pendingIds = new Set<number>();

export const renderSystem = async (registry: Registry, ctx: Context) => {
  const entities = registry.getIndexedZipper([PositionComponent, RenderableComponent]);
  const graphics = ctx.libs.getGraphics<Graphics2DLibrary>();
  const assetManager = ctx.libs.getAssetManager<AssetManagerLibrary>();
  const seenIds = new Set<number>();

  for (const entity of entities) {
    seenIds.add(entity.id);
    const sprite = spriteCache.get(entity.id);

    if (!sprite && !pendingIds.has(entity.id)) {
      pendingIds.add(entity.id);

      const imageFile = assetManager.getAsset(entity.RenderableComponent.spriteKey);
      const animationsFile = assetManager.getAsset(entity.RenderableComponent.animationsKey);

      const image = await loadImage(imageFile.path);
      if (!image) continue;
      const animations = animationsFile
        ? await loadAnimations(animationsFile)
        : {
            idle: [0, 0, image.width, image.height],
          };

      pendingIds.delete(entity.id);


      const newSprite = new Sprite({
        x: entity.PositionComponent.x,
        y: entity.PositionComponent.y,
        image,
        animation: "idle",
        animations,
        frameRate: 7,
        scale: { x: entity.RenderableComponent.scale.x, y: entity.RenderableComponent.scale.y },
      });

      newSprite.offsetX(newSprite.width() / 2);

      entity.RenderableComponent.sprite = newSprite;

      newSprite.start();
      graphics.baseLayer.add(newSprite);
      spriteCache.set(entity.id, newSprite);
    }

    sprite?.position({ x: entity.PositionComponent.x, y: entity.PositionComponent.y });
  }

  for (const [id, sprite] of spriteCache) {
    if (!seenIds.has(id)) {
      sprite.destroy();
      spriteCache.delete(id);
    }
  }

  graphics.baseLayer.batchDraw();
};

// * Required to generate code
export default renderSystem.name;
