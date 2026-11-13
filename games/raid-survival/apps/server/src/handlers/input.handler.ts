import type { ClientMessageOf } from "@raid-survival/shared/protocol";
import type { Registry } from "@nanoforge-dev/ecs/server";
import type { Context } from "@nanoforge-dev/common";

import { clientOf } from "../queries";
import { Velocity2D } from "../components/velocity-2d.component";
import { Position2D } from "../components/position-2d.component";
import { MoveInput } from "../components/move-input.component";
import { ShootInput } from "../components/shoot-input.component";
import { ReviveInput } from "../components/revive-input.component";
import { broadcast } from "../broadcast";
import { Direction } from "../components/direction.component";

export const inputHandler = (
  clientId: string,
  packet: ClientMessageOf<"input">,
  registry: Registry,
  ctx: Context,
): void => {
  // Resolved by clientId -> entityId, not by matching a username - usernames aren't unique, so
  // matching by name previously let one player's input packets drive another player's character.
  const client = clientOf(registry, clientId);
  if (!client) return;

  const entity = registry.entityFromIndex(client.id);
  const velocity = registry.getEntityComponent(entity, Velocity2D);
  const position = registry.getEntityComponent(entity, Position2D);
  const direction = registry.getEntityComponent(entity, Direction);
  const moveInput = registry.getEntityComponent(entity, MoveInput);
  const shootInput = registry.getEntityComponent(entity, ShootInput);
  const reviveInput = registry.getEntityComponent(entity, ReviveInput);
  // A client still in the lobby (not yet spawned into a game) has none of these components.
  if (!velocity || !position || !direction || !moveInput || !shootInput || !reviveInput) return;

  // Shots fall back to this direction, so it must be a unit vector: a zero one would fire bullets
  // that never move, a long one faster bullets. An unusable one is ignored.
  const length =
    packet.direction && Number.isFinite(packet.direction.x) && Number.isFinite(packet.direction.y)
      ? Math.hypot(packet.direction.x, packet.direction.y)
      : 0;
  if (packet.direction && Number.isFinite(length) && length > 0) {
    direction.x = packet.direction.x / length;
    direction.y = packet.direction.y / length;
    broadcast(ctx, {
      type: "direction",
      id: client.id,
      direction: { x: direction.x, y: direction.y },
    });
  }

  // Just records held-key intent - move-input.system.ts recomputes Velocity2D from this every tick.
  if (Array.isArray(packet.moveKeys)) {
    moveInput.up = packet.moveKeys.includes("up");
    moveInput.down = packet.moveKeys.includes("down");
    moveInput.left = packet.moveKeys.includes("left");
    moveInput.right = packet.moveKeys.includes("right");
  }

  if (typeof packet.shooting === "boolean") {
    shootInput.shooting = packet.shooting;
  }
  if (
    packet.mousePosition &&
    Number.isFinite(packet.mousePosition.x) &&
    Number.isFinite(packet.mousePosition.y)
  ) {
    shootInput.mousePosition = { x: packet.mousePosition.x, y: packet.mousePosition.y };
  }
  // One-shot: a fresh "R" press, not a held state.
  if (packet.reload) {
    shootInput.reloadRequested = true;
  }

  if (typeof packet.reviveKeyHeld === "boolean") {
    reviveInput.held = packet.reviveKeyHeld;
  }

  // One-shot: a fresh E press, not a held state.
  if (packet.interactRequested) {
    reviveInput.interactRequested = true;
  }
};
