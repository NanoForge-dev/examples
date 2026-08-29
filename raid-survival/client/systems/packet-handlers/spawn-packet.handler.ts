import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { TransformComponent } from "../../components/essentials/transform.component";
import { Velocity } from "../../components/essentials/velocity.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";
import { Direction } from "../../components/direction.component";
import { Layer } from "@nanoforge-dev/graphics-2d";
import { clientConfig, sceneManager } from "../../main";
import { ShootController } from "../../components/shoot.controller";
import { MoveController } from "../../components/move-controller.component";
import { Entity } from "@nanoforge-dev/ecs-server";
import { ChildrenComponent } from "../../components/children.component";
import { Health } from "../../components/health.component";
import { ZIndexComponent } from "../../components/essentials/z-index.component";
import { buildHealthBar } from "./start-game-packet.handler";
import { Player } from "../../components/player.component";

// Native crop size (zombie-animations.txt, unscaled).
const ZOMBIE_SPRITE_SIZE = { width: 30, height: 30 };

function buildPlayer(newEnt: Entity, packet: any, registry: Registry) {
  registry.addComponent(newEnt, new Player());

  if (packet.login === clientConfig.login) {
    registry.addComponent(newEnt, new MoveController(clientConfig));
    registry.addComponent(newEnt, new ShootController(clientConfig));
  }

  registry.addComponent(newEnt, new Direction(packet.direction.x, packet.direction.y));
  registry.addComponent(newEnt, new Velocity(packet.velocity.x, packet.velocity.y));
  registry.addComponent(
    newEnt,
    new SpriteComponent("player.png", {
      animationsKey: "player-animations.txt",
      scale: { x: 3, y: 3 },
    }),
  );

  const hand = registry.spawnEntity();
  registry.addComponent(hand, new TransformComponent(packet.position.x, packet.position.y));
  registry.addComponent(
    hand,
    new SpriteComponent("hands.png", {
      scale: { x: 3, y: 3 },
    }),
  );
  registry.addComponent(
    hand,
    new ChildrenComponent(newEnt.getId(), {})
  )
}

export function spawnPacketHandler(packet: any, registry: Registry): void {
  const zipper = registry.getZipper([NetworkId]);
  const it = zipper.find(({ NetworkId }) => {
    return NetworkId.id === packet.id;
  });
  if (it) console.error("entity with networkId already exist: ", packet.networkId);
  const newEnt = registry.spawnEntity();
  registry.addComponent(newEnt, new TransformComponent(packet.position.x, packet.position.y));
  if (packet.id !== undefined) {
    registry.addComponent(newEnt, new NetworkId(packet.id));
  }
  switch (packet.entityType) {
    case "player":
      buildPlayer(newEnt, packet, registry);
      break;
    case "zombie":
      registry.addComponent(newEnt, new Velocity(packet.velocity.x, packet.velocity.y));
      // No Direction component here on purpose: sprite-animator.system.ts zips
      // [Direction, SpriteComponent, Velocity] to drive walk/idle + flip for players, and
      // zombie-animations.txt has no "walk" key - it would crash Konva's Sprite and fight
      // zombie-state-packet.handler's own idle/attack switching. zombieState packets are the
      // sole owner of this sprite's animation.
      registry.addComponent(newEnt, new Health(packet.health.current, packet.health.max));
      registry.addComponent(newEnt, new ZIndexComponent(10));
      registry.addComponent(
        newEnt,
        new SpriteComponent("GZ2-Zombie-Puncher.png", {
          layer: sceneManager.getScene()?.layer || new Layer(),
          animationsKey: "zombie-animations.txt",
        }),
      );
      buildHealthBar(
        sceneManager.getScene()?.layer || new Layer(),
        registry,
        newEnt,
        ZOMBIE_SPRITE_SIZE.width,
        packet.health,
      );
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
