import type {Registry} from "@nanoforge-dev/ecs-client";
import {EndGamePopup} from "../components/ui.component";
import {initializeGame} from "../main";

export const EndGameSystem = (registry: Registry) => {
    const EndGamePopups: {EndGamePopup: EndGamePopup}[] = registry.getZipper([EndGamePopup]);
    const popup = EndGamePopups[0];

    if (!popup) {
        return;
    }

    if (popup.EndGamePopup.restartPressed) {
        registry.clearEntities();
        initializeGame(registry);
    }
}