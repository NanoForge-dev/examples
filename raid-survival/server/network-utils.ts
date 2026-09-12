import { NetworkServerLibrary } from "@nanoforge-dev/network-server";
import { clients } from "./main";

export function sendToInGamePlayers(network: NetworkServerLibrary, packet: unknown) {
  // `connected` is only ever set to false (packet-handler.system.ts) - a disconnected client is
  // never actually removed from `clients` (that only happens on a full game-over reset, see
  // main.ts). Without this check, every broadcast for the rest of the match - and bullets are by
  // far the most frequent one, several times a second per shooter - re-attempts sendToClient on
  // that dead id. sendToClient itself won't throw (it just logs "Unknown client: <id>" and
  // returns - see @nanoforge-dev/network-server's TCPServer), but that's still one synchronous,
  // blocking console.error per stale client per broadcast, forever, which at bullet frequency is
  // enough log volume to noticeably stall the tick loop - the exact "everything slows down /
  // bullets stop first" symptom this was written to rule in or out.
  clients.forEach(({ clientId, connected }) => {
    if (clientId !== -1 && connected) {
      network.tcp.sendToClient(clientId, new TextEncoder().encode(JSON.stringify(packet)));
    }
  });
}
