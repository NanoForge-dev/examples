import { type Context, NfFile } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Graphics2DLibrary, Sprite } from "@nanoforge-dev/graphics-2d";
import { Position } from "../../components/position.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { RotationComponent } from "../../components/rotation.component";

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

export const spriteSystem = async (registry: Registry, ctx: Context) => {
  const entities: {id: number, Position: Position, SpriteComponent: SpriteComponent}[] = registry.getIndexedZipper([Position, SpriteComponent]);
  const graphics = ctx.libs.getGraphics<Graphics2DLibrary>();
  const assetManager = ctx.libs.getAssetManager<AssetManagerLibrary>();

  for (const entity of entities) {
    if (!entity.SpriteComponent.sprite && !entity.SpriteComponent.loading) {
      entity.SpriteComponent.loading = true;
      const imageFile = assetManager.getAsset(entity.SpriteComponent.spriteKey);
      const animationsFile = assetManager.getAsset(entity.SpriteComponent.animationsKey || "");

      const image = await loadImage(imageFile.path);
      if (!image) continue;
      const animations = animationsFile
        ? await loadAnimations(animationsFile)
        : {
            idle: [0, 0, image.width, image.height],
          };

      const [, , frameWidth, frameHeight] =
        animations && animations["idle"] ? animations["idle"] : [0, 0, image.width, image.height];

      const newSprite = new Sprite({
        x: entity.Position.x,
        y: entity.Position.y,
        image,
        animation: "idle",
        animations,
        frameRate: 7,
        width: frameWidth || 24,
        height: frameHeight || 24,
        scale: {
          x: entity.SpriteComponent.getScale().x,
          y: entity.SpriteComponent.getScale().y,
        },
      });

      newSprite.offsetX(newSprite.width() / 2);

      entity.SpriteComponent.sprite = newSprite;

      newSprite.start();
      entity.SpriteComponent.layer?.add(newSprite);
      entity.SpriteComponent.loading = false;
    }

    entity.SpriteComponent.sprite?.position({
      x: entity.Position.x + entity.SpriteComponent.sprite.offsetX(),
      y: entity.Position.y + entity.SpriteComponent.sprite.offsetY(),
    });

    const rotation = registry.getEntityComponent(registry.entityFromIndex(entity.id), RotationComponent);
    if (!rotation) continue;
    entity.SpriteComponent.sprite?.rotation(rotation.angle);
  }

  graphics.stage.batchDraw();
};

// * Required to generate code
export default spriteSystem.name;
