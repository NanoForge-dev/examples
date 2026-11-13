import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/input";
import "@nanoforge-dev/music";
import { DrawableText2D } from "../components/drawable-text-2d.component";

import { MuteOnKey } from "../components/mute-on-key.component";

/**
 * Turns the music on or off when the key of a `MuteOnKey` is pressed, and writes the state in
 * its entity's text.
 *
 * @system
 * @side client
 */
export const muteMusicOnKey = (registry: Registry, ctx: Context) => {
  registry.getZipper([MuteOnKey, DrawableText2D]).forEach(({ MuteOnKey, DrawableText2D }) => {
    const down = ctx.input.isKeyPressed((MuteOnKey as MuteOnKey).key) === true;
    if (down && !MuteOnKey.held) {
      ctx.music.mute();
      MuteOnKey.muted = !MuteOnKey.muted;
    }
    MuteOnKey.held = down;
    DrawableText2D.text = MuteOnKey.muted ? "Music off: press M" : "Music on: press M to mute";
  });
};
