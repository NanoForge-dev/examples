import {type EditorSystemManifest, type Registry} from "@nanoforge-dev/ecs-client";

import {Cell, CellState, Marker} from "../components/board.component";
import {GameInfo} from "../components/game.component";
import {TurnText} from "../components/ui.component";
import {Context} from "@nanoforge-dev/common";
import {SoundLibrary} from "@nanoforge-dev/sound";
import {AssetManagerLibrary} from "@nanoforge-dev/asset-manager";

export const cellSystem = (registry: Registry, ctx: Context) => {
  const cells: {Cell: Cell}[] = registry.getZipper([Cell]);
  const soundLibrary = ctx.libs.getSound<SoundLibrary>();
  const assetManager = ctx.libs.getAssetManager<AssetManagerLibrary>();
  const gameInfoArray: {GameInfo: GameInfo}[] = registry.getZipper([GameInfo]);
  const TurnTextArray: {TurnText: TurnText}[] = registry.getZipper([TurnText]);
  const gameInfo = gameInfoArray[0];

  if (!gameInfo) {return;}

  for (const {Cell} of cells) {
    if (Cell.pressed && Cell.state == CellState.Empty) {
      const marker = registry.spawnEntity();
      registry.addComponent(marker, new Marker(Cell.x, Cell.y, Cell.size, gameInfo.GameInfo.isFirstPlayerTurn));
      Cell.state = gameInfo.GameInfo.isFirstPlayerTurn ? CellState.X : CellState.O;

      const file = assetManager.getAsset("marker.mp3");
      soundLibrary.load("marker", file.path);
      soundLibrary.play("marker");

      gameInfo.GameInfo.isFirstPlayerTurn = !gameInfo.GameInfo.isFirstPlayerTurn;
      for (const {TurnText} of TurnTextArray) {
        TurnText.update(gameInfo.GameInfo.isFirstPlayerTurn);
      }
    }
  }
};

// * Required to generate code
export default cellSystem.name;

// * Required for the editor to display the system and generate code
export const EDITOR_SYSTEM_MANIFEST: EditorSystemManifest = {
  name: "Example",
  description:
    "This system end the game when paramB reaches 0 for any entity with ExampleComponent",
  dependencies: ["ExampleComponent"],
};
