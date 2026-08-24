import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { Position } from "../../components/position.component";
import { Velocity } from "../../components/velocity.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { Direction } from "../../components/direction.component";
import { clientConfig } from "../../main";
import { ShootController } from "../../components/shoot.controller";
import { MoveController } from "../../components/move-controller.component";

export function spawnPacketHandler(packet: any, registry: Registry): void {
  const zipper = registry.getZipper([NetworkId]);
  const it = zipper.find(({ NetworkId }) => {
    return NetworkId.id === packet.id;
  });
  if (it) console.error("entity with networkId already exist: ", packet.networkId);
  const newEnt = registry.spawnEntity();
  registry.addComponent(newEnt, new Position(packet.position.x, packet.position.y));
  if (packet.id !== undefined) {
    registry.addComponent(newEnt, new NetworkId(packet.id));
  }
  switch (packet.entityType) {
    case "player":
      registry.addComponent(newEnt, new Direction(packet.direction.x, packet.direction.y));
      registry.addComponent(newEnt, new Velocity(packet.velocity.x, packet.velocity.y));
      registry.addComponent(
        newEnt,
        new SpriteComponent("player.png", {
          animationsKey: "player-animations.txt",
          scale: { x: 3, y: 3 },
        }),
      );
      if (packet.login === clientConfig.login) {
        registry.addComponent(newEnt, new MoveController(clientConfig));
        registry.addComponent(newEnt, new ShootController(clientConfig));
      }
      break;
    case "zombie":
      registry.addComponent(newEnt, new Velocity(packet.velocity.x, packet.velocity.y));
      registry.addComponent(newEnt, new Direction(packet.direction.x, packet.direction.y));
      break;
    case "map":
      registry.addComponent(newEnt, new SpriteComponent("map.png"));
      break;
    case "nexus":
      break;
    default:
      console.error("entity type unknow: ", packet.entityType);
  }
}
