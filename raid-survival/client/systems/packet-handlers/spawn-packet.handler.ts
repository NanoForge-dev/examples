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

// Scales wall-animations.txt's 18x27 crop down slightly to fit the tile's 16px width.
const BUILDING_SPRITE_SCALE = { x: 0.85, y: 0.85 };

// Native crop size (zombie-animations.txt, unscaled).
const ZOMBIE_SPRITE_SIZE = { width: 30, height: 30 };

// Above players/zombies (10) so a bullet is never visually hidden behind whatever it's about to
// hit; below the held weapon (21).
const BULLET_Z_INDEX = 15;

const BULLET_SPRITE_SIZE = { width: 16, height: 16 }; // native crop size, unscaled

// Native crop size shared by all 6 tower-animations.txt levels (uniform on purpose - see that
// file - so this stays correct across upgrades without needing to change with Tower.level).
const TOWER_SPRITE_SIZE = { width: 39, height: 43 };
// Native crop size (npc-animations.txt's single "idle" frame: "15,4,17,19").
const NPC_SPRITE_SIZE = { width: 17, height: 19 };
// Purely decorative garrison standing on the tower's roof, centered horizontally. x subtracts
// half the NPC's own width (not just half the tower's) because both render as top-left-anchored
// - using towerWidth/2 alone would align the NPC's corner, not its center, with the tower's.
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
  // Currently unreachable - nothing server-side sends a "spawn" packet with entityType:"player"
  // (players are built via start-game-packet.handler.ts's own buildPlayer instead) - but resolved
  // to the player's real skin rather than a "player.png" file that doesn't exist, in case that
  // ever changes.
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
    // A duplicate NetworkId means something upstream didn't clean up before reusing an id - refuse
    // the second spawn rather than let two entities answer to one id.
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
      // No Direction component: sprite-animator.system.ts would try to play a "walk" animation
      // zombie-animations.txt doesn't have. zombieState packets own this sprite's animation.
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
      // zOrderSystem only reorders entities with both ZIndexComponent and SpriteComponent.
      registry.addComponent(newEnt, new ZIndexComponent(10));
      const layer = sceneManager.getScene()?.layer || new Layer();
      if (packet.buildingType === "tower") {
        // "idle" IS level 1's crop, so this renders correctly without an extra setAnimation call.
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
        // Direction only, no Velocity - spriteAnimator would otherwise try to play a "walk"
        // animation npc-animations.txt doesn't have.
        registry.addComponent(npc, new Direction(0, 0));
        registry.addComponent(npc, new ZIndexComponent(TOWER_NPC_Z_INDEX));

        // A small held gun, decorative - a sibling of the NPC (not its child) to avoid the extra
        // tick of position lag a child-of-a-child would add.
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
      // packet.position is the server's muzzle CENTER point (a bullet is a point, not a box - see
      // bullet.system.ts), but spriteSystem renders every TransformComponent as a top-left corner
      // - offset here or the bullet renders half its sprite size down-right of where it should be.
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
