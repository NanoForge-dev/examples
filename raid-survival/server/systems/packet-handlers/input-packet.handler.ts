import { Registry } from "@nanoforge-dev/ecs-client";
import { Velocity } from "../../components/velocity.component";
import { Position } from "../../components/position.component";
import { clients, PLAYER_SPEED } from "../../main";
import { Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";
import { sendToInGamePlayers } from "../../network-utils";
import { Direction } from "../../components/direction.component";
import { Login } from "../../components/clientId.component";

export function inputPacketHandler(
  clientId: number,
  packet: any,
  registry: Registry,
  ctx: Context,
): void {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  const zipper = registry.getIndexedZipper([Login, Velocity, Position, Direction]);
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

  if (packet.moveKeys) {
    let dx = 0;
    let dy = 0;

    if (packet.moveKeys.findIndex((key: string) => key === "up") !== -1) dy -= 1;
    if (packet.moveKeys.findIndex((key: string) => key === "down") !== -1) dy += 1;
    if (packet.moveKeys.findIndex((key: string) => key === "left") !== -1) dx -= 1;
    if (packet.moveKeys.findIndex((key: string) => key === "right") !== -1) dx += 1;

    const len = Math.hypot(dx, dy) || 1;
    it.Velocity.x = (dx / len) * PLAYER_SPEED;
    it.Velocity.y = (dy / len) * PLAYER_SPEED;

    console.log(it, zipper)
    sendToInGamePlayers(network, {
      type: "move",
      id: it.id,
      velocity: { x: it.Velocity.x, y: it.Velocity.y },
      position: { x: it.Position.x, y: it.Position.y },
    });
  }
}
