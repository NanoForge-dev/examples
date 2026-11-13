import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/sound";

import { SoundEffect } from "../components/sound-effect.component";

/** Whether the sound library was unmuted. */
let unmuted = false;

/**
 * Loads every `SoundEffect` into the sound library, so that systems can play it by its key.
 *
 * @remarks
 * The sound library starts muted: the first run unmutes it.
 *
 * @system
 * @side client
 */
export const loadSounds = (registry: Registry, ctx: Context) => {
  registry.getZipper([SoundEffect]).forEach(({ SoundEffect }) => {
    if (SoundEffect.loaded) return;
    ctx.sound.load(SoundEffect.key, ctx.assets.getAsset(SoundEffect.path).path);
    SoundEffect.loaded = true;
  });
  // shortcut: `mute()` is a toggle with no getter, so this assumes one sound library per page load.
  if (!unmuted) {
    ctx.sound.mute();
    unmuted = true;
  }
};
