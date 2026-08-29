import { type Registry } from "@nanoforge-dev/ecs-client";
import { NetworkClientLibrary } from "@nanoforge-dev/network-client";
import { Context } from "@nanoforge-dev/common";
import { movePacketHandler } from "./packet-handlers/move-packet.handler";
import { spawnPacketHandler } from "./packet-handlers/spawn-packet.handler";
import { directionPacketHandler } from "./packet-handlers/direction-packet.handler";
import { killPacketHandler } from "./packet-handlers/kill-packet.handler";
import { hitPacketHandler } from "./packet-handlers/hit-packet.handler";
import { zombieStatePacketHandler } from "./packet-handlers/zombie-state-packet.handler";
import { waveInfoPacketHandler } from "./packet-handlers/wave-info-packet.handler";
import { gameOverPacketHandler } from "./packet-handlers/game-over-packet.handler";
import { moneyPacketHandler } from "./packet-handlers/money-packet.handler";
import { buildPacketHandler } from "./packet-handlers/build-packet.handler";
import { joinLobbyPacketHandler } from "./packet-handlers/join-lobby-packet.handler";
import { lobbyInfoPacketHandler } from "./packet-handlers/lobby-info-packet.handler";
import {startGamePacketHandler} from "./packet-handlers/start-game-packet.handler";

export type PacketHandler = (packet: unknown, registry: Registry, ctx: Context) => unknown;

export const packetHandlers: Map<string, PacketHandler> = new Map([
  ["move", movePacketHandler],
  ["spawn", spawnPacketHandler],
  ["direction", directionPacketHandler],
  ["kill", killPacketHandler],
  ["hit", hitPacketHandler],
  ["zombieState", zombieStatePacketHandler],
  ["waveInfo", waveInfoPacketHandler],
  ["gameOver", gameOverPacketHandler],
  ["money", moneyPacketHandler],
  ["build", buildPacketHandler],
  ["joinLobby", joinLobbyPacketHandler],
  ["lobbyInfo", lobbyInfoPacketHandler],
  ["startGame", startGamePacketHandler],
]);

export function packetHandler(registry: Registry, ctx: Context) {
  const network = ctx.libs.getNetwork<NetworkClientLibrary>();
  const jsonPackets = network.tcp
    .getReceivedPackets()
    .map((packet: AllowSharedBufferSource | undefined) => {
      return JSON.parse(new TextDecoder().decode(packet));
    });

  if (!jsonPackets || jsonPackets.length === 0) return;
  jsonPackets.forEach((packet) => {
    packetHandlers.get(packet.type)?.(packet, registry, ctx);
  });
}
