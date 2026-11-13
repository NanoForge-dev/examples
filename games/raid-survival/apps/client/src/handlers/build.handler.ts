import type { ServerMessageOf } from "@raid-survival/shared/protocol";
// A rejection here should only happen from a race (money spent or tile taken between the preview
// and the click landing) - not worth full UI plumbing, but worth not silently swallowing.
export const buildHandler = (packet: ServerMessageOf<"build">): void => {
  if (packet.result === "rejected") {
    console.warn("Build rejected:", packet.reason);
  }
};
