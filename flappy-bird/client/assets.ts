import type { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { Image } from "@nanoforge-dev/graphics-2d";

export interface Sprites {
  background: HTMLImageElement;
  ground: HTMLImageElement;
  birdFrames: HTMLImageElement[];
  pipe: HTMLImageElement;
  gameover: HTMLImageElement;
  message: HTMLImageElement;
  digits: HTMLImageElement[];
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    Image.fromURL(
      url,
      (node) => {
        const image = node.image();
        if (image) resolve(image as HTMLImageElement);
        else reject(new Error(`Failed to load image: ${url}`));
      },
      () => reject(new Error(`Failed to load image: ${url}`)),
    );
  });
}

export async function loadSprites(assetManager: AssetManagerLibrary): Promise<Sprites> {
  const url = (path: string): string => assetManager.getAsset(path).path;

  const [background, ground, up, mid, down, pipe, gameover, message, ...digits] = await Promise.all(
    [
      loadImage(url("background-day.png")),
      loadImage(url("base.png")),
      loadImage(url("yellowbird-upflap.png")),
      loadImage(url("yellowbird-midflap.png")),
      loadImage(url("yellowbird-downflap.png")),
      loadImage(url("pipe-green.png")),
      loadImage(url("gameover.png")),
      loadImage(url("message.png")),
      ...Array.from({ length: 10 }, (_, i) => loadImage(url(`${i}.png`))),
    ],
  );
  return { background, ground, birdFrames: [up, mid, down], pipe, gameover, message, digits };
}

export async function loadSounds(
  assetManager: AssetManagerLibrary,
  sound: { load: (key: string, file: string) => void },
): Promise<void> {
  sound.load("wing", assetManager.getAsset("wing.wav").path);
  sound.load("hit", assetManager.getAsset("hit.wav").path);
  sound.load("point", assetManager.getAsset("point.wav").path);
  sound.load("die", assetManager.getAsset("die.wav").path);
  sound.load("swoosh", assetManager.getAsset("swoosh.wav").path);
}
