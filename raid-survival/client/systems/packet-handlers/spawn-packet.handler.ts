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
import { Building } from "../../components/building.component";
import { TILE_SIZE } from "../../map-data";

// Wall's native crop (wall-animations.txt) is an 18x27 barrel - close to square already, just
// scaled down slightly to land near the tile's own 16px width. The barrel standing a bit taller
// than the tile it sits on reads fine (same visual-vs-footprint gap already accepted for the
// lobby and zombies), unlike the old wide barricade sprite which spilled sideways into neighbors.
const BUILDING_SPRITE_SCALE = { x: 0.85, y: 0.85 };

// Native crop size (zombie-animations.txt, unscaled).
const ZOMBIE_SPRITE_SIZE = { width: 30, height: 30 };

// Above players/zombies (10) so a bullet is never visually hidden behind whatever it's about to
// hit; below the held weapon (21).
const BULLET_Z_INDEX = 15;

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
    case "building": {
      // Only one building type exists today ("wall"), so this is hardcoded rather than a
      // type->sprite lookup - add one if a second type shows up. ZIndexComponent is required,
      // not optional polish: zOrderSystem only reorders entities with both ZIndexComponent and
      // SpriteComponent, so without it a building would fall into the same "never reordered,
      // stuck below whatever's z-indexed" trap the grid/preview hit (see build-mode.system.ts).
      registry.addComponent(newEnt, new ZIndexComponent(10));
      registry.addComponent(
        newEnt,
        new SpriteComponent("objects.png", {
          layer: sceneManager.getScene()?.layer || new Layer(),
          animationsKey: "wall-animations.txt",
          scale: BUILDING_SPRITE_SCALE,
        }),
      );
      registry.addComponent(newEnt, new Building(packet.buildingType));
      registry.addComponent(newEnt, new Health(packet.health.current, packet.health.max));
      buildHealthBar(sceneManager.getScene()?.layer || new Layer(), registry, newEnt, TILE_SIZE, packet.health);
      break;
    }
    case "bullet":
      // Position+Velocity is all move.system.ts needs to dead-reckon it in a straight line,
      // exactly matching the server's own physics (a bullet never changes velocity after firing,
      // so there's no drift to correct with follow-up packets, unlike a steering zombie). No
      // Direction/rotation - the tracer dot doesn't need to visually point the way it's flying
      // at this scale.
      registry.addComponent(newEnt, new Velocity(packet.velocity.x, packet.velocity.y));
      registry.addComponent(newEnt, new ZIndexComponent(BULLET_Z_INDEX));
      registry.addComponent(
        newEnt,
        new SpriteComponent("weapons.png", {
          layer: sceneManager.getScene()?.layer || new Layer(),
          animationsKey: "bullet-animations.txt",
        }),
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
