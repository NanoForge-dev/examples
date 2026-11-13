import { definePacket } from "@nanoforge-dev/network";

type Vector = { x: number; y: number };
type Key = "up" | "down" | "stop";

const KEYS: unknown[] = ["up", "down", "stop"] satisfies Key[];

/** Sent once by a client to join: the server answers with `Seated`. */
export const Play = definePacket("play");

/** The paddle a client plays: 1 (left), 2 (right), or 0 when it watches. */
export const Seated = definePacket<{ paddle: number }>("seated");

/** Where a client wants its paddle to go. Anything else than the three keys is dropped. */
export const Input = definePacket<{ key: Key }>("input", {
  validate: (data): data is { key: Key } =>
    typeof data === "object" && data !== null && KEYS.includes((data as { key?: unknown }).key),
});

/** The position and velocity of the entity of `NetworkId` `id`, sent when its velocity changes. */
export const Move = definePacket<{ id: number; position: Vector; velocity: Vector }>("move");
