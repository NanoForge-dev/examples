import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";

import { NetworkId } from "../components/network-id.component";
import { Seat } from "../components/seat.component";
import { Velocity2D } from "../components/velocity-2d.component";
import { Play, Seated } from "../protocol";

/**
 * Seats each client that sends `Play` on a free `Seat`, or as a watcher, tells it with `Seated`,
 * and has the whole game sent again. A seat whose client left is freed, and its paddle stops.
 *
 * @system
 * @side server
 */
export const seatPlayers = (registry: Registry, ctx: Context) => {
  const seats = registry.getZipper([Seat, Velocity2D]);

  for (const { Seat: seat, Velocity2D: velocity } of seats) {
    if (seat.client === undefined || ctx.network.getClientInfo(seat.client)) continue;
    seat.client = undefined;
    velocity.y = 0;
  }

  for (const { clientId } of ctx.network.packets.read(Play)) {
    if (seats.some(({ Seat }) => Seat.client === clientId)) continue;
    const free = seats.find(({ Seat }) => Seat.client === undefined);
    if (free) free.Seat.client = clientId;
    ctx.network.packets.sendToClient(clientId, Seated, { paddle: free?.Seat.player ?? 0 });
    registry.getZipper([NetworkId]).forEach(({ NetworkId }) => {
      NetworkId.sentX = Number.NaN;
    });
  }
};
