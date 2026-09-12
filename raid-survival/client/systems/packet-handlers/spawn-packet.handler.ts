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
import { buildHealthBar, buildInteractIndicator } from "./start-game-packet.handler";
import { Player } from "../../components/player.component";
import { Building } from "../../components/building.component";
import { TowerLevelComponent } from "../../components/tower-level.component";
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

// Native crop size (bullet-animations.txt, unscaled) - see the "bullet" spawn case below for why
// this matters beyond just documentation.
const BULLET_SPRITE_SIZE = { width: 16, height: 16 };

// Native crop size shared by all 6 tower-animations.txt levels (uniform on purpose - see that
// file - so this stays correct across upgrades without needing to change with Tower.level).
const TOWER_SPRITE_SIZE = { width: 39, height: 43 };
// Native crop size (npc-animations.txt's single "idle" frame: "15,4,17,19").
const NPC_SPRITE_SIZE = { width: 17, height: 19 };
// Purely decorative garrison standing on top of a freshly-built tower (npc-animations.txt's
// single idle frame, plus a small held gun from weapons.png) - no gameplay effect, never updated
// again after spawn (a tower's level/HP changes don't touch this). Local to the tower's own
// TransformComponent (its top-left, same origin the tower sprite itself renders from) - centered
// horizontally on the sprite, near its roof. Offsets are an approximate guess, easy to retune
// visually.
//
// x is TOWER_SPRITE_SIZE.width / 2 minus half the NPC's OWN width, not just half the tower's
// width: transformChildrenToParentSystem sets this child's TransformComponent to
// parent.x + LocalTransform.x, and spriteSystem renders every TransformComponent as a top-left
// corner (see its offsetX/offsetY comment) - so a LocalTransform.x of just towerWidth/2 lines up
// the NPC's own top-left corner with the tower's horizontal center, not the NPC's center, leaving
// it rendered half the NPC's width too far right instead of actually centered on the tower.
const TOWER_NPC_LOCAL_OFFSET = {
  x: TOWER_SPRITE_SIZE.width / 2 - NPC_SPRITE_SIZE.width / 2,
  y: 8,
};
const TOWER_NPC_GUN_LOCAL_OFFSET = {
  x: TOWER_NPC_LOCAL_OFFSET.x + 7,
  y: TOWER_NPC_LOCAL_OFFSET.y + 5,
};
const TOWER_NPC_GUN_SCALE = 0.6;
// Above the tower's own sprite (Z-index 10, same as a wall) so the garrison actually reads as
// standing ON it, not behind it - zOrderSystem only reorders entities that carry BOTH
// ZIndexComponent and SpriteComponent, so these are required, not optional polish.
const TOWER_NPC_Z_INDEX = 16;
const TOWER_NPC_GUN_Z_INDEX = 21;

// objects.png's 15x12 loot-box icons (loot-heal/-gold/-ammo-animations.txt) - see
// zombie-death.system.ts / loot-box-pickup.system.ts.
const LOOT_BOX_ANIMATIONS_KEYS: Record<"heal" | "gold" | "ammo", string> = {
  heal: "loot-heal-animations.txt",
  gold: "loot-gold-animations.txt",
  ammo: "loot-ammo-animations.txt",
};

function buildPlayer(newEnt: Entity, packet: any, registry: Registry) {
  registry.addComponent(newEnt, new Player());

  if (packet.login === clientConfig.login) {
    registry.addComponent(newEnt, new MoveController(clientConfig));
    registry.addComponent(newEnt, new ShootController(clientConfig));
  }

  registry.addComponent(newEnt, new Direction(packet.direction.x, packet.direction.y));
  registry.addComponent(newEnt, new Velocity(packet.velocity.x, packet.velocity.y));
  // "player.png" doesn't exist as a static asset (only player1.png..player3.png do) - this path
  // is currently unreachable (nothing server-side ever sends a "spawn" packet with
  // entityType:"player", see spawnPacketHandler below; every player is built via
  // start-game-packet.handler.ts's own buildPlayer instead), but fixed to the player's actual
  // chosen skin (see start-game-packet.handler.ts's buildPlayer) rather than left pointing at a
  // file that can't load.
  const skin =
    Number.isInteger(packet.skin) && packet.skin >= 1 && packet.skin <= 3 ? packet.skin : 1;
  registry.addComponent(
    newEnt,
    new SpriteComponent(`player${skin}.png`, {
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
  registry.addComponent(hand, new ChildrenComponent(newEnt.getId(), {}));
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
    console.error(
      `spawnPacketHandler: entity with NetworkId ${packet.id} (${packet.entityType}) already exists - refusing duplicate spawn`,
    );
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
      // ZIndexComponent is required, not optional polish: zOrderSystem only reorders entities
      // with both ZIndexComponent and SpriteComponent, so without it a building would fall into
      // the same "never reordered, stuck below whatever's z-indexed" trap the grid/preview hit
      // (see build-mode.system.ts).
      registry.addComponent(newEnt, new ZIndexComponent(10));
      const layer = sceneManager.getScene()?.layer || new Layer();
      if (packet.buildingType === "tower") {
        // tower-animations.txt's "idle" key IS level 1's crop, so a freshly-built tower renders
        // correctly with no extra setAnimation call - tower-update-packet.handler.ts only needs
        // to touch it again on an actual level-up/heal, later.
        registry.addComponent(
          newEnt,
          new SpriteComponent("buildings.png", { layer, animationsKey: "tower-animations.txt" }),
        );

        const npc = registry.spawnEntity();
        registry.addComponent(npc, new TransformComponent(0, 0));
        registry.addComponent(
          npc,
          new SpriteComponent("npc.png", { layer, animationsKey: "npc-animations.txt" }),
        );
        registry.addComponent(
          npc,
          new ChildrenComponent(newEnt.getId(), { LocalTransform: TOWER_NPC_LOCAL_OFFSET }),
        );
        // Direction only, no Velocity - transformChildrenToParentSystem needs Direction to
        // position this every tick, but adding Velocity too would pull this into
        // spriteAnimator's [Direction, SpriteComponent, Velocity] zip, which would try to play
        // a "walk" animation npc-animations.txt doesn't have (crashes Konva's Sprite - see the
        // "zombie" case above for the same trap).
        registry.addComponent(npc, new Direction(0, 0));
        // Required, not optional polish: zOrderSystem only reorders entities carrying BOTH
        // ZIndexComponent and SpriteComponent - without this, the moment any z-indexed sprite set
        // changes elsewhere (the first zombie spawns), the NPC gets swept permanently below every
        // z-indexed sprite instead of staying above the tower it's standing on (same trap
        // build-mode.system.ts's gridShape/previewRect comment describes).
        registry.addComponent(npc, new ZIndexComponent(TOWER_NPC_Z_INDEX));

        // A small held gun (weapons.png's smallGun icon) - purely decorative, parented directly
        // to the tower (a sibling of the NPC, not a child of it) the same way a player's hand and
        // weapon are siblings under the player rather than nested - avoids a one-tick position lag
        // that chaining child-of-a-child would introduce.
        const gun = registry.spawnEntity();
        registry.addComponent(gun, new TransformComponent(0, 0));
        registry.addComponent(
          gun,
          new SpriteComponent("weapons.png", {
            layer,
            animationsKey: "weapons-animations.txt",
            scale: { x: TOWER_NPC_GUN_SCALE, y: TOWER_NPC_GUN_SCALE },
          }),
        );
        registry.addComponent(
          gun,
          new ChildrenComponent(newEnt.getId(), { LocalTransform: TOWER_NPC_GUN_LOCAL_OFFSET }),
        );
        registry.addComponent(gun, new Direction(0, 0));
        registry.addComponent(gun, new ZIndexComponent(TOWER_NPC_GUN_Z_INDEX));
      } else {
        // Only "wall" is left here now - add a branch above for any future non-tower type.
        registry.addComponent(
          newEnt,
          new SpriteComponent("objects.png", {
            layer,
            animationsKey: "wall-animations.txt",
            scale: BUILDING_SPRITE_SCALE,
          }),
        );
      }
      registry.addComponent(newEnt, new Building(packet.buildingType));
      registry.addComponent(newEnt, new Health(packet.health.current, packet.health.max));
      if (packet.buildingType === "tower") {
        registry.addComponent(newEnt, new TowerLevelComponent(1));
      }
      // The health bar/interact hint center on this width - the tower's own uniform sprite width
      // (not its wider 3x3 collision footprint), so they stay visually centered over the actual
      // art.
      const healthBarWidth = packet.buildingType === "tower" ? TOWER_SPRITE_SIZE.width : TILE_SIZE;
      buildHealthBar(layer, registry, newEnt, healthBarWidth, packet.health);
      buildInteractIndicator(layer, registry, newEnt, healthBarWidth);
      break;
    }
    case "lootBox":
      registry.addComponent(newEnt, new ZIndexComponent(10));
      registry.addComponent(
        newEnt,
        new SpriteComponent("objects.png", {
          layer: sceneManager.getScene()?.layer || new Layer(),
          animationsKey:
            LOOT_BOX_ANIMATIONS_KEYS[packet.lootType as "heal" | "gold" | "ammo"] ??
            LOOT_BOX_ANIMATIONS_KEYS.gold,
        }),
      );
      break;
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
