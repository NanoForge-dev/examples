import { type Registry } from "@nanoforge-dev/ecs-client";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";
import { Context } from "@nanoforge-dev/common";
import { inputPacketHandler } from "./packet-handlers/input-packet.handler";
import { clients } from "../main";
import { joinLobbyPacketHandler } from "./packet-handlers/join-lobby-packet.handler";
import { startGamePacketHandler } from "./packet-handlers/start-game-packet.handler";
import { buildPacketHandler } from "./packet-handlers/build-packet.handler";
import { buyWeaponPacketHandler } from "./packet-handlers/buy-weapon-packet.handler";
import { buyAmmoPacketHandler } from "./packet-handlers/buy-ammo-packet.handler";
import { equipWeaponPacketHandler } from "./packet-handlers/equip-weapon-packet.handler";

export type PacketHandler = (
  client: number,
  packet: unknown,
  registry: Registry,
  ctx: Context,
) => unknown;

export const packetHandlers: Map<string, PacketHandler> = new Map([
  ["input", inputPacketHandler],
  ["joinLobby", joinLobbyPacketHandler],
  ["startGame", startGamePacketHandler],
  ["build", buildPacketHandler],
  ["buyWeapon", buyWeaponPacketHandler],
  ["buyAmmo", buyAmmoPacketHandler],
  ["equipWeapon", equipWeaponPacketHandler],
]);

export function packetHandler(registry: Registry, ctx: Context) {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();
  const connectedClients = network.tcp.getConnectedClients();
  clients.forEach((client) => {
    if (connectedClients.findIndex((id) => id === client.clientId) === -1) {
      client.connected = false;
    }
  });
  network.tcp.getReceivedPackets().forEach((packets, client) => {
    const jsonPackets = packets.map((packet: AllowSharedBufferSource | undefined) => {
      return JSON.parse(new TextDecoder().decode(packet));
    });
    if (!jsonPackets || jsonPackets.length === 0) return;
    jsonPackets.forEach((packet) => {
      packetHandlers.get(packet.type)?.(client, packet, registry, ctx);
    });
  });
}
