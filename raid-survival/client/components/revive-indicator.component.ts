import { Arc, Ring } from "@nanoforge-dev/graphics-2d";

// One per player (built alongside their health bar - see buildReviveIndicator in
// start-game-packet.handler.ts), showing a grey->green "hold E to revive" progress circle above
// a downed player - visible to every client near the body, not just whoever's channeling.
// `background` is the always-fully-drawn grey Ring (the "grey circle"); `fill` is the green Arc
// drawn on top of it, whose angle grows from 0 to 360 as progress advances (the "going green").
// revive-packet.handler.ts drives active/elapsed/durationSeconds from the server's authoritative
// revive.system.ts events; revive-indicator.system.ts advances elapsed and positions both shapes
// every tick.
export class ReviveIndicatorComponent {
  name = this.constructor.name;

  constructor(
    public background: Ring,
    public fill: Arc,
  ) {}

  active: boolean = false;
  elapsed: number = 0;
  durationSeconds: number = 0;
}

// * Required to generate code
export default ReviveIndicatorComponent.name;
