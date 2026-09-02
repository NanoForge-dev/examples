import { Registry } from "@nanoforge-dev/ecs-client";
import { NetworkId } from "../../components/network-id.component";
import { TransformComponent } from "../../components/essentials/transform.component";
import { Velocity } from "../../components/essentials/velocity.component";
import { SpriteComponent } from "../../components/renderable/sprite.component";

export function zombieStatePacketHandler(packet: any, registry: Registry): void {
  const entities: {
    NetworkId: NetworkId;
    TransformComponent: TransformComponent;
    Velocity: Velocity;
    SpriteComponent: SpriteComponent;
  }[] = registry.getZipper([NetworkId, TransformComponent, Velocity, SpriteComponent]);

  const entity = entities.find(({ NetworkId }) => NetworkId.id === packet.id);
  if (!entity) return;

  entity.TransformComponent.x = packet.position.x;
  entity.TransformComponent.y = packet.position.y;
  entity.Velocity.x = packet.velocity.x;
  entity.Velocity.y = packet.velocity.y;

  const nextAnimation = packet.state === "attack" ? "attack" : packet.state === "dying" ? "death" : "idle";
  entity.SpriteComponent.setAnimation(nextAnimation);

  // Konva's Sprite loops any animation indefinitely on its own (confirmed in its source -
  // _updateIndex wraps frameIndex back to 0 once it passes the last frame, with no "play once"
  // option) - left alone, "death" would loop back to its own first frame (the zombie mid-fall,
  // reads as briefly standing back up) before the server's kill packet (zombie-death.system.ts's
  // DEATH_ANIM_SECONDS, an independent clock from this client-side animation) arrives to destroy
  // it. Freeze on the real last frame the instant the animation reaches it, via Konva's own
  // frameIndexChange event (its native mechanism - see Sprite.js's `_updateIndex`, which fires
  // this same event on every advance) rather than a timer guessing when that moment is.
  if (packet.state === "dying") {
    const konvaSprite = entity.SpriteComponent.sprite;
    const frames = konvaSprite?.animations()?.["death"];
    if (konvaSprite && frames) {
      const lastFrameIndex = frames.length / 4 - 1;
      const freezeOnLastFrame = () => {
        if (konvaSprite.frameIndex() >= lastFrameIndex) {
          konvaSprite.stop();
          konvaSprite.off("frameIndexChange.deathFreeze", freezeOnLastFrame);
        }
      };
      konvaSprite.on("frameIndexChange.deathFreeze", freezeOnLastFrame);
    }
  }
}
