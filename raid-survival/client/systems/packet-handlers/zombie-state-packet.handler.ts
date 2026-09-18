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

  // Konva loops any animation indefinitely with no "play once" option - without this, "death"
  // would loop back to frame 0 (looks like standing back up) before the server's kill packet
  // arrives. Freeze on the last frame via Konva's own frameIndexChange event.
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
