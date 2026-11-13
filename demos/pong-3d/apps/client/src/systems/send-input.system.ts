import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs";
import "@nanoforge-dev/input";

import { PaddleInput } from "../components/paddle-input.component";
import { Input, Seated } from "../pong-protocol";

/**
 * Sends the local player's `PaddleInput` keys to the server when they change, once it has a
 * seat (`Seated`).
 *
 * @system
 * @side client
 */
export const sendInput = (registry: Registry, ctx: Context) => {
  const seated = ctx.network.packets.read(Seated).at(-1);

  registry.getZipper([PaddleInput]).forEach(({ PaddleInput: player }) => {
    if (seated) player.seat = seated.data.paddle;
    if (player.seat === 0) return;
    const up = ctx.input.isKeyPressed(player.up) === true;
    const down = ctx.input.isKeyPressed(player.down) === true;
    const flip = player.mirrored && player.seat === 2;
    let key: "up" | "down" | "stop" = "stop";
    if (up !== down) key = up !== flip ? "up" : "down";
    if (key === player.sent) return;
    ctx.network.packets.send(Input, { key });
    player.sent = key;
  });
};
