import { Registry } from "@nanoforge-dev/ecs-client";
import { Velocity } from "../../components/velocity.component";
import { Position } from "../../components/position.component";
import { MoveInput } from "../../components/move-input.component";
import { clients } from "../../main";
import { Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";
import { sendToInGamePlayers } from "../../network-utils";
import { Direction } from "../../components/direction.component";
import { Login } from "../../components/login.component";

export function inputPacketHandler(
  clientId: number,
  packet: any,
  registry: Registry,
  ctx: Context,
): void {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  const zipper = registry.getIndexedZipper([Login, Velocity, Position, Direction, MoveInput]);
  const log = clients.find((client) => client.clientId === clientId)?.username;
  const it = zipper.find(({ Login }) => {
    return Login.id === log;
  });
  if (!it) return;

  if (packet.direction) {
    it.Direction.x = packet.direction.x;
    it.Direction.y = packet.direction.y;
    sendToInGamePlayers(network, {
      type: "direction",
      id: it.id,
      direction: { x: it.Direction.x, y: it.Direction.y },
    });
  }

  // Just records held-key intent - move-input.system.ts recomputes actual Velocity from this
  // every tick (not only when a packet like this one arrives), so a wall collision zeroing an
  // axis (collision-resolve.ts) is never left stuck once the player is no longer blocked, even
  // though the client only sends a fresh packet when the *set* of held keys changes.
  if (packet.moveKeys) {
    it.MoveInput.up = packet.moveKeys.includes("up");
    it.MoveInput.down = packet.moveKeys.includes("down");
    it.MoveInput.left = packet.moveKeys.includes("left");
    it.MoveInput.right = packet.moveKeys.includes("right");
  }
}
