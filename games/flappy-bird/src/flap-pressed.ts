import type { Context } from "@nanoforge-dev/common";
import { InputEnum } from "@nanoforge-dev/input";

import { justPressed } from "./just-pressed";

/** Whether the game was touched since the last call. */
let tapped = false;
let listening = false;

/**
 * Whether the player flapped since the last call: Space, a click or a tap on the game.
 *
 * @remarks
 * The input library has no touch events, and the mouse events a browser makes from a tap are
 * likely to go down and up between two frames, where no system sees them: taps are listened to
 * here.
 */
export const flapPressed = (ctx: Context): boolean => {
  if (!listening) {
    listening = true;
    window.addEventListener(
      "touchstart",
      (event) => {
        if (!(event.target instanceof HTMLCanvasElement)) return;
        // No scrolling or zooming the page, and no mouse events made from the tap.
        event.preventDefault();
        tapped = true;
      },
      { passive: false },
    );
  }
  const space = justPressed(ctx, InputEnum.Space);
  const click = justPressed(ctx, InputEnum.MouseLeft);
  const tap = tapped;
  tapped = false;
  return space || click || tap;
};
