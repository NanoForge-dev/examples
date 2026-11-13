import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { Seat } from "../components/seat.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { Input } from "../pong-protocol";

const DIRECTIONS = { up: -1, down: 1, stop: 0 };

/**
 * Moves each `Seat`'s paddle as its client's `Input` says. Inputs of clients without a seat are
 * ignored.
 *
 * @system
 * @side server
 */
export const steerPaddles = (registry: Registry, ctx: Context) => {
  const seats = registry.getZipper([Seat, Velocity2D]);

  for (const { clientId, data } of ctx.network.packets.read(Input)) {
    const seat = seats.find(({ Seat }) => Seat.client === clientId);
    if (seat) seat.Velocity2D.y = DIRECTIONS[data.key] * seat.Seat.speed;
  }
};
