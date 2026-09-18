import { type Context, NfFile } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Graphics2DLibrary, Sprite } from "@nanoforge-dev/graphics-2d";
import { TransformComponent } from "../../components/essentials/transform.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";

type Animations = Record<string, number[]>;

// Blob URLs (pre-fetched assets) can intermittently fail to resolve under memory pressure,
// especially in Safari - retrying the same URL a couple of times recovers the transient case.
const ASSET_LOAD_MAX_ATTEMPTS = 3;
const ASSET_LOAD_RETRY_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(load: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= ASSET_LOAD_MAX_ATTEMPTS; attempt++) {
    try {
      return await load();
    } catch (err) {
      lastError = err;
      if (attempt < ASSET_LOAD_MAX_ATTEMPTS) await sleep(ASSET_LOAD_RETRY_DELAY_MS * attempt);
    }
  }
  throw lastError;
}

const imageCache = new Map<string, HTMLImageElement>();
const imageLoading = new Map<string, Promise<HTMLImageElement>>();

function loadImageOnce(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${path}`));
    image.src = path;
  });
}

function loadImage(path: string): Promise<HTMLImageElement | undefined> {
  if (imageCache.has(path)) return Promise.resolve(imageCache.get(path));
  if (imageLoading.has(path)) return Promise.resolve(imageLoading.get(path));

  const promise = withRetry(() => loadImageOnce(path));
  // Single .then(onFulfilled, onRejected), not .finally() - avoids a second derived promise that
  // could trip its own "unhandled rejection" warning independent of spriteSystem's own catch.
  promise.then(
    (image) => {
      imageCache.set(path, image);
      imageLoading.delete(path);
    },
    () => imageLoading.delete(path),
  );

  imageLoading.set(path, promise);
  return promise;
}

const animationsCache = new Map<string, Animations>();
const animationsLoading = new Map<string, Promise<Animations>>();

function loadAnimations(file: NfFile): Promise<Animations | undefined> {
  if (animationsCache.has(file.path)) return Promise.resolve(animationsCache.get(file.path));
  if (animationsLoading.has(file.path)) return Promise.resolve(animationsLoading.get(file.path));

  const promise = withRetry(() => file.text()).then((raw) => {
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
  // Same single-handler reasoning as loadImage above; also ensures a failed load is removed from
  // animationsLoading so a later call can retry instead of replaying the same rejection forever.
  promise.then(
    () => animationsLoading.delete(file.path),
    () => animationsLoading.delete(file.path),
  );

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
      !entity.SpriteComponent.failed
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

        // The awaits above can outlive this entity: a "kill" packet can call registry.killEntity()
        // on it before this continuation resumes, but that can't null out this closure's already-
        // captured `entity.SpriteComponent` reference. Without this re-check, a bullet killed
        // almost immediately (e.g. point-blank shotgun pellets) would get its sprite created and
        // added to the layer after the kill that was supposed to prevent it - a permanently visible
        // orphan sprite. Comparing identity also catches a killed-then-ID-recycled entity.
        const stillAlive = registry.getEntityComponent(
          registry.entityFromIndex(entity.id),
          SpriteComponent,
        );
        if (stillAlive !== entity.SpriteComponent) continue;

        const newSprite = new Sprite({
          x: entity.TransformComponent.x,
          y: entity.TransformComponent.y,
          image,
          animation: "idle",
          animations,
          frameRate: entity.SpriteComponent.frameRate,
          width: frameWidth || 24,
          height: frameHeight || 24,
          scale: {
            x: entity.SpriteComponent.getScale().x,
            y: entity.SpriteComponent.getScale().y,
          },
        });

        // offsetX/offsetY mark the point rotation()/flipY() pivot around - both axes need it, not
        // just X, or a rotating sprite swings/displaces around its top edge instead of spinning in
        // place. Defaults to the crop's own center; overridable via SpriteComponent's `pivot` for
        // art whose visual center isn't the frame's geometric center (e.g. a held weapon's grip).
        const pivot = entity.SpriteComponent.getPivot();
        newSprite.offsetX(pivot?.x ?? newSprite.width() / 2);
        newSprite.offsetY(pivot?.y ?? newSprite.height() / 2);

        entity.SpriteComponent.sprite = newSprite;

        newSprite.start();
        entity.SpriteComponent.layer?.add(newSprite);
      } catch (err) {
        // No auto-reload - that would throw away the whole session over one asset hiccup. Just
        // log and give up on this entity; other entities sharing the same spriteKey still get
        // their own independent attempt.
        entity.SpriteComponent.failed = true;
        console.error(
          `spriteSystem: giving up on sprite "${entity.SpriteComponent.spriteKey}" after a load failure ` +
            `(this entity will stay invisible; it will not be retried).`,
          err,
        );
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
