import { Arc, Ring } from "@nanoforge-dev/graphics-2d";

/**
 * Grey->green "hold E to revive" progress circle above a downed player, visible to everyone
 * nearby. `background` is the static grey Ring; `fill` is the green Arc whose angle grows 0-360
 * as progress advances. Driven by revive.system.ts's server events via revive-packet.handler.ts.
 *
 * @component
 * @side client
 */
export class ReviveIndicatorComponent {
  name = "ReviveIndicatorComponent";

  constructor(
    public background: Ring,
    public fill: Arc,
  ) {}

  active: boolean = false;
  elapsed: number = 0;
  durationSeconds: number = 0;
}
