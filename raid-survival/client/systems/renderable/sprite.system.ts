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
        const stillAlive = registry.getEntityComponent(registry.entityFromIndex(entity.id), SpriteComponent);
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
