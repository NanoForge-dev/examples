import { Registry } from "@nanoforge-dev/ecs-client";
import { Velocity } from "../../components/velocity.component";
import { Position } from "../../components/position.component";
import { MoveInput } from "../../components/move-input.component";
import { ShootInput } from "../../components/shoot-input.component";
import { ReviveInput } from "../../components/revive-input.component";
import { clients } from "../../main";
import { Context } from "@nanoforge-dev/common";
import { NetworkServerLibrary } from "@nanoforge-dev/network-server";
import { sendToInGamePlayers } from "../../network-utils";
import { Direction } from "../../components/direction.component";

export function inputPacketHandler(
  clientId: number,
  packet: any,
  registry: Registry,
  ctx: Context,
): void {
  const network = ctx.libs.getNetwork<NetworkServerLibrary>();

  // Resolved by clientId -> entityId, not by matching a username - usernames aren't unique, so
  // matching by name previously let one player's input packets drive another player's character.
  const client = clients.find((c) => c.clientId === clientId);
  if (!client) return;

  const entity = registry.entityFromIndex(client.entityId);
  const velocity = registry.getEntityComponent(entity, Velocity);
  const position = registry.getEntityComponent(entity, Position);
  const direction = registry.getEntityComponent(entity, Direction);
  const moveInput = registry.getEntityComponent(entity, MoveInput);
  const shootInput = registry.getEntityComponent(entity, ShootInput);
  const reviveInput = registry.getEntityComponent(entity, ReviveInput);
  // A client still in the lobby (not yet spawned into a game) has none of these components.
  if (!velocity || !position || !direction || !moveInput || !shootInput || !reviveInput) return;

  if (packet.direction) {
    direction.x = packet.direction.x;
    direction.y = packet.direction.y;
    sendToInGamePlayers(network, {
      type: "direction",
      id: client.entityId,
      direction: { x: direction.x, y: direction.y },
    });
  }

  // Just records held-key intent - move-input.system.ts recomputes Velocity from this every tick.
  if (packet.moveKeys) {
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
    typeof packet.mousePosition.x === "number" &&
    typeof packet.mousePosition.y === "number"
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
}
