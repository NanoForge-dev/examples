import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/input";
import "@nanoforge-dev/network/client";
import { Join, Move } from "@network/protocol/protocol";

import { MoveSender } from "../components/move-sender.component";

/**
 * Asks the server for a player once, then sends it the direction of the keys of `MoveSender`
 * each time it changes.
 *
 * @system
 * @side client
 */
export const sendMoves = (registry: Registry, ctx: Context) => {
  const held = (key: MoveSender["left"]) => Number(ctx.input.isKeyPressed(key) === true);

  registry.getZipper([MoveSender]).forEach(({ MoveSender }) => {
    if (!MoveSender.joined) {
      ctx.network.packets.send(Join);
      MoveSender.joined = true;
    }
    const { left, right, up, down } = MoveSender as MoveSender;
    const x = (held(right) - held(left)) as -1 | 0 | 1;
    const y = (held(down) - held(up)) as -1 | 0 | 1;
    if (x === MoveSender.sentX && y === MoveSender.sentY) return;
    ctx.network.packets.send(Move, { x, y });
    MoveSender.sentX = x;
    MoveSender.sentY = y;
  });
};
