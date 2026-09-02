import { NetworkServerLibrary } from "@nanoforge-dev/network-server";
import { clients } from "./main";

export function sendToInGamePlayers(network: NetworkServerLibrary, packet: unknown) {
  clients.forEach(({ clientId }) => {
    if (clientId !== -1) {
      network.tcp.sendToClient(clientId, new TextEncoder().encode(JSON.stringify(packet)));
    }
  });
}
