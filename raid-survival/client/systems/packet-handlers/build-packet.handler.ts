// A rejection here should only happen from a race (money spent or tile taken between the preview
// and the click landing) - not worth full UI plumbing, but worth not silently swallowing.
export function buildPacketHandler(packet: any): void {
  if (packet.result === "rejected") {
    console.warn("Build rejected:", packet.reason);
  }
}
