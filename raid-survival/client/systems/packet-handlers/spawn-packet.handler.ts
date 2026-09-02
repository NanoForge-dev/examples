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
import { pickPlayerSkin } from "../../player-skins";

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

// Native crop size (bullet-animations.txt, unscaled) - see the "bullet" spawn case below for why
// this matters beyond just documentation.
const BULLET_SPRITE_SIZE = { width: 16, height: 16 };

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
    // "player.png" doesn't exist as a static asset (only player1.png..player4.png do) - this path
    // is currently unreachable (nothing server-side ever sends a "spawn" packet with
    // entityType:"player", see spawnPacketHandler below; every player is built via
    // start-game-packet.handler.ts's own buildPlayer instead), but fixed to a real, per-player
    // skin rather than left pointing at a file that can't load.
    new SpriteComponent(pickPlayerSkin(packet.id ?? 0), {
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
  if (it) {
    // Was `packet.networkId` (doesn't exist on a spawn packet - always logged undefined) and fell
    // through to spawn a second entity sharing the same NetworkId anyway. A stale entity left
    // behind (its own kill packet lost, delayed, or never sent) sharing an id with a freshly
    // spawned one means every later id-routed packet (hit/kill/state) is ambiguous - .find() picks
    // whichever entity happens to come first, which can silently be the stale, already-dead one:
    // a zombie that LOOKS freshly spawned but never registers a hit and whose health bar reads
    // whatever the stale corpse's was (often empty). Refusing the duplicate spawn outright is the
    // conservative fix - better to drop one spawn than let two entities answer to one id - but if
    // this fires at all, the actual bug is upstream (something isn't cleaning up before reusing
    // the id) and is worth knowing about.
    console.error(`spawnPacketHandler: entity with NetworkId ${packet.id} (${packet.entityType}) already exists - refusing duplicate spawn`);
    return;
  }
  const newEnt = registry.spawnEntity();
  const transform = new TransformComponent(packet.position.x, packet.position.y);
  registry.addComponent(newEnt, transform);
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
      // so there's no drift to correct with follow-up packets, unlike a steering zombie).
      // bullet-animations.txt's crop is an elongated pill, not a round dot, so it needs to be
      // rotated to match its flight direction, same as any other sprite - rotation is set once
      // here (not via DirectionRotatorComponent/a Direction component - overkill for something
      // whose direction never changes after spawn) since spriteSystem already applies
      // TransformComponent.rotation to every sprite unconditionally, every tick.
      //
      // packet.position here is unlike every other entity type's spawn position: weapon.system.ts
      // (server) computes and sends the bullet's actual muzzle CENTER point directly (it's treated
      // as a dimensionless point server-side - "a bullet is a point, not a box", bullet.system.ts),
      // not a top-left corner of some known box the way a player/zombie/building's position is.
      // But spriteSystem renders EVERY TransformComponent as a top-left, adding half the sprite's
      // own width/height to find where to actually center it on screen (needed so rotation pivots
      // around the sprite's true center, not a corner - see sprite.system.ts's offsetX/offsetY).
      // Without correcting for that here, a bullet would render half its own sprite size away
      // from the exact point the server computed (down-right, since spriteSystem always adds
      // rather than subtracts) - the muzzle-center fix and the offsetY pivot fix each did their
      // own job correctly, but together they exposed this: a bullet consistently rendering below
      // and right of where it was actually aimed.
      transform.x -= BULLET_SPRITE_SIZE.width / 2;
      transform.y -= BULLET_SPRITE_SIZE.height / 2;
      registry.addComponent(newEnt, new Velocity(packet.velocity.x, packet.velocity.y));
      transform.rotation = (Math.atan2(packet.velocity.y, packet.velocity.x) * 180) / Math.PI;
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
