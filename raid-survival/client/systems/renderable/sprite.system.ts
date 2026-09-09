import { type Context, NfFile } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs-client";

import { Graphics2DLibrary, Sprite } from "@nanoforge-dev/graphics-2d";
import { TransformComponent } from "../../components/essentials/transform.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";

type Animations = Record<string, number[]>;

// A path here is a blob: URL (see AssetManagerLibrary.getAsset/NfFile - assets are pre-fetched
// into blobs once, up front, during the initial "Download: X.png" loading screen; this code never
// sees a real HTTP path to retry against). Blob URLs are locally-resolved, no network round trip,
// but browsers - WebKit/Safari especially - can intermittently fail to resolve one under load or
// memory pressure (observed: Image.onerror with no detail, and separately a bare
// "NetworkError when attempting to fetch resource" from the fetch() inside loadAnimations' NfFile
// - that exact wording is Safari's, Chrome says "Failed to fetch"). Retrying the SAME blob URL a
// couple of times recovers the transient case; it can't help a permanently-revoked blob (the asset
// manager gives us nothing else to fall back to), which is still a real, separate limitation.
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
const failedSpriteKeys = new Set<string>();

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
  // A single .then(onFulfilled, onRejected) rather than separate .then()/.finally() calls -
  // each one hangs its own derived promise off `promise`, and an unused derived promise that
  // rejects (.finally() mirrors the original's outcome) trips an "unhandled rejection" warning
  // of its own, on top of whatever spriteSystem's own await/catch already reports for `promise`
  // itself. This one settles (never rejects) regardless of which branch runs, so nothing else
  // needs to observe it.
  promise.then(
    (image) => {
      imageCache.set(path, image);
      imageLoading.delete(path);
    },
    () => imageLoading.delete(path), // give up path already logs/handles this in spriteSystem
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
  // Same single-handler reasoning as loadImage above - avoids a second derived promise (from a
  // separate .finally()) that could trip its own "unhandled rejection" warning. This also fixes a
  // latent gap the original code had: on failure it never removed the rejected promise from
  // animationsLoading at all, leaving every future call for the same file permanently stuck
  // replaying that one rejection instead of ever being eligible to load again.
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

        // This function is async and both awaits above can genuinely take a frame or more (a
        // first-ever load for this spriteKey/animationsKey; a cached one resolves on a microtask,
        // still after this synchronous pass through entities has moved on) - long enough for a
        // "kill" packet to reach and process registry.killEntity() on this exact entity before
        // this continuation resumes. registry.killEntity() only removes the entity from the ECS
        // registry; it cannot reach into (let alone null out) this already-captured JS closure's
        // `entity.SpriteComponent` reference (same WASM-core boundary destroySprite exists to work
        // around - see kill-packet.handler.ts). Left unguarded, a short-lived bullet that's hit
        // almost immediately (shotgun pellets at point-blank range) resurrects: its sprite gets
        // created and added to the layer *after* the kill that was supposed to prevent it,  and
        // nothing ever destroys it again - a permanently visible, entityless sprite. Re-fetching
        // the live component and comparing identity catches both a killed entity (nothing found)
        // and a killed-then-ID-recycled one (found, but a different SpriteComponent instance).
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

        // Both axes, not just X - offsetY was never set here, so it defaulted to 0 (the crop's
        // TOP edge). position() below compensates exactly for a sprite at rest (rotation 0, no
        // flip), so this was invisible for every non-rotating sprite - but rotation()/flipY()
        // pivot around whatever point offset marks, and a sprite pivoting around its top edge
        // instead of its true center visibly swings/displaces as it rotates (worse the taller the
        // crop) instead of spinning cleanly in place. Concretely: bullets logically spawn at the
        // exact player center (position + hitbox center - the math already matched), but rendered
        // off that center by roughly half the bullet sprite's height once rotated to its flight
        // angle; the held weapon/hand similarly visibly drooped off their true rest angle. Fixing
        // the pivot doesn't change any previously-measured rotation-offset angle (that's about
        // which way the art faces, independent of which point it spins around).
        // Defaults to the crop's own geometric center - correct for art drawn centered in its
        // frame - but overridable per SpriteComponent (see its `pivot` option) for art that isn't,
        // like a held weapon whose grip sits off-center in a frame with empty space reserved for a
        // muzzle-flash/recoil animation.
        const pivot = entity.SpriteComponent.getPivot();
        newSprite.offsetX(pivot?.x ?? newSprite.width() / 2);
        newSprite.offsetY(pivot?.y ?? newSprite.height() / 2);

        entity.SpriteComponent.sprite = newSprite;

        newSprite.start();
        entity.SpriteComponent.layer?.add(newSprite);
      } catch (err) {
        // No auto-reload here on purpose - a page reload mid-game throws away the whole session
        // for everyone in it over one asset hiccup, which is far worse than one sprite staying
        // invisible. Just log it and move on; this spriteKey won't be retried (see
        // failedSpriteKeys above).
        failedSpriteKeys.add(entity.SpriteComponent.spriteKey);
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
