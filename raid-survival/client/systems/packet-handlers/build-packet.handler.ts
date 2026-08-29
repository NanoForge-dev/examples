// Placement is already validated client-side before a click is even accepted
// (build-mode.system.ts uses the same canPlaceBuilding check the server does), so a rejection
// here should only ever happen from a race (money spent or a tile taken between the preview and
// the click landing) - not worth full UI plumbing for, but worth not silently swallowing either.
export function buildPacketHandler(packet: any): void {
  if (packet.result === "rejected") {
    console.warn("Build rejected:", packet.reason);
  }
}
