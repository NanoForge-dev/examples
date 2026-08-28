import { type Context, NfFile } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Graphics2DLibrary, Sprite } from "@nanoforge-dev/graphics-2d";
import { TransformComponent } from "../../components/essentials/transform.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";

type Animations = Record<string, number[]>;

const imageCache = new Map<string, HTMLImageElement>();
const imageLoading = new Map<string, Promise<HTMLImageElement>>();
const failedSpriteKeys = new Set<string>();

const ASSET_RELOAD_COOLDOWN_MS = 15000;
const ASSET_RELOAD_STORAGE_KEY = "nf_sprite_asset_reload_at";

function recoverFromStaleAsset(spriteKey: string, path: string, err: unknown) {
  if (!path.startsWith("blob:")) return false;

  try {
    const last = Number(sessionStorage.getItem(ASSET_RELOAD_STORAGE_KEY) ?? 0);
    if (Date.now() - last < ASSET_RELOAD_COOLDOWN_MS) {
      console.error(
        `spriteSystem: sprite "${spriteKey}" failed with a stale asset URL, and we already reloaded ` +
          `recently - not reloading again to avoid a loop.`,
        err,
      );
      return false;
    }
    sessionStorage.setItem(ASSET_RELOAD_STORAGE_KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable - fall through and still attempt the reload once.
  }

  console.error(
    `spriteSystem: sprite "${spriteKey}" failed with a stale blob: asset URL (nf's hot-reload/OPFS asset ` +
      `cache went stale for this tab) - reloading the page to recover.`,
    err,
  );
  setTimeout(() => window.location.reload(), 300);
  return true;
}

function loadImage(path: string): Promise<HTMLImageElement | undefined> {
  if (imageCache.has(path)) return Promise.resolve(imageCache.get(path));
  if (imageLoading.has(path)) return Promise.resolve(imageLoading.get(path));

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      imageCache.set(path, image);
      imageLoading.delete(path);
      resolve(image);
    };
    image.onerror = () => {
      imageLoading.delete(path);
      reject(new Error(`Failed to load image: ${path}`));
    };
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
  const entities: {
    id: number;
    TransformComponent: TransformComponent;
    SpriteComponent: SpriteComponent;
  }[] = registry.getIndexedZipper([TransformComponent, SpriteComponent]);
  const graphics = ctx.libs.getGraphics<Graphics2DLibrary>();
  const assetManager = ctx.libs.getAssetManager<AssetManagerLibrary>();

  for (const entity of entities) {
    if (
      !entity.SpriteComponent.sprite &&
      !entity.SpriteComponent.loading &&
      !failedSpriteKeys.has(entity.SpriteComponent.spriteKey)
    ) {
      entity.SpriteComponent.loading = true;
      let imageFile: NfFile | undefined;
      try {
        imageFile = assetManager.getAsset(entity.SpriteComponent.spriteKey);
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
          x: entity.TransformComponent.x,
          y: entity.TransformComponent.y,
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
      } catch (err) {
        failedSpriteKeys.add(entity.SpriteComponent.spriteKey);

        const recovering = imageFile ? recoverFromStaleAsset(entity.SpriteComponent.spriteKey, imageFile.path, err) : false;
        if (!recovering) {
          console.error(
            `spriteSystem: giving up on sprite "${entity.SpriteComponent.spriteKey}" after a load failure ` +
              `(this entity will stay invisible; it will not be retried).`,
            err,
          );
        }
      } finally {
        entity.SpriteComponent.loading = false;
      }
    }

    entity.SpriteComponent.sprite?.position({
      x: entity.TransformComponent.x + entity.SpriteComponent.sprite.offsetX(),
      y: entity.TransformComponent.y + entity.SpriteComponent.sprite.offsetY(),
    });

    entity.SpriteComponent.sprite?.rotation(entity.TransformComponent.rotation);
  }

  graphics.stage.batchDraw();
};

// * Required to generate code
export default spriteSystem.name;
