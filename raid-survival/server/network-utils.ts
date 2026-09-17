import { NetworkServerLibrary } from "@nanoforge-dev/network-server";
import { clients } from "./main";

export function sendToInGamePlayers(network: NetworkServerLibrary, packet: unknown) {
  // Skip disconnected clients (they stay in `clients` until game-over, not removed on disconnect)
  // - sendToClient on a dead id just logs and returns, but at bullet-broadcast frequency that log
  // volume alone is enough to stall the tick loop.
  clients.forEach(({ clientId, connected }) => {
    if (clientId !== -1 && connected) {
      network.tcp.sendToClient(clientId, new TextEncoder().encode(JSON.stringify(packet)));
    }
  });
}
