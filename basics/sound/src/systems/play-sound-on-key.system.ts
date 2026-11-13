import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/input";
import "@nanoforge-dev/sound";
import { PlayOnKey } from "../components/play-on-key.component";

/**
 * Plays the sound of every `PlayOnKey` whose key was just pressed: sounds may overlap. Loads
 * each sound into the sound library, under its asset path, the first time it sees it; a
 * missing asset is reported once.
 *
 * @system
 * @side client
 */
export const playSoundOnKey = (registry: Registry, ctx: Context) => {
  registry.getZipper([PlayOnKey]).forEach(({ PlayOnKey }) => {
    const { key, file } = PlayOnKey as PlayOnKey;
    if (!PlayOnKey.status && file) {
      try {
        ctx.sound.load(file, ctx.assets.getAsset(file).path);
        PlayOnKey.status = "loaded";
      } catch (error) {
        // Once per component, not every frame: the key stays silent.
        console.warn(`No sound at "${file}":`, error);
        PlayOnKey.status = "missing";
      }
    }
    const down = ctx.input.isKeyPressed(key) === true;
    if (down && !PlayOnKey.held && PlayOnKey.status === "loaded") ctx.sound.play(file);
    PlayOnKey.held = down;
  });
};
