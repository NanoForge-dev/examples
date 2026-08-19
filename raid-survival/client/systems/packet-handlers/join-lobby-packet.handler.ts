import { Registry } from "@nanoforge-dev/ecs-client";
import { Position } from "../../components/position.component";
import { RenderableComponent } from "../../components/renderable.component";
import { Context } from "@nanoforge-dev/common";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { Clickable } from "../../components/clickable.component";
import { NetworkClientLibrary } from "@nanoforge-dev/network-client";

export function joinLobbyPacketHandler(packet: any, registry: Registry, ctx: Context): void {
  if (packet.result === "success") {
    const startEnt = registry.spawnEntity();
    registry.addComponent(startEnt, new Position(500, 500));
    const renderableComponent = new RenderableComponent(
      "start_button.png",
      ctx.libs.getGraphics<Graphics2DLibrary>().baseLayer,
    );
    registry.addComponent(startEnt, renderableComponent);
    registry.addComponent(
      startEnt,
      new Clickable({ x: 500, y: 500 }, () => {
        renderableComponent.sprite?.destroy();
        registry.killEntity(startEnt);
        ctx.libs
          .getNetwork<NetworkClientLibrary>()
          .tcp.sendData(new TextEncoder().encode(JSON.stringify({ type: "startGame" })));
      }),
    );
  } else if (packet.result === "full") {
    console.error("lobby is full")
  }
}
