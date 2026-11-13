import { Channel, definePacket } from "@nanoforge-dev/network";

/** The play area, in pixels: the server keeps every player inside it. */
export const ARENA = { width: 800, height: 600 };

/** Side of a player's square, in pixels. */
export const PLAYER_SIZE = 40;

/** Pixels per second a player moves at. */
export const PLAYER_SPEED = 300;

/** A direction on one axis: -1 (left or up), 0, or 1 (right or down). */
type Direction = -1 | 0 | 1;

const isDirection = (value: unknown): value is Direction =>
  value === -1 || value === 0 || value === 1;

/** Client to server, once: puts the client's player in the game. */
export const Join = definePacket("join");

/** Client to server, when the keys held change: where the player wants to go. */
export const Move = definePacket<{ x: Direction; y: Direction }>("move", {
  // The server never trusts a client: anything but two directions is dropped.
  validate: (data): data is { x: Direction; y: Direction } =>
    typeof data === "object" &&
    data !== null &&
    isDirection((data as { x?: unknown }).x) &&
    isDirection((data as { y?: unknown }).y),
});

/** Server to every client, each tick: where every player is. */
export const Players = definePacket<{ id: string; x: number; y: number }[]>("players", {
  channel: Channel.UnreliableOrdered,
});
