import type {Registry} from "@nanoforge-dev/ecs-client";
import {Cell, CellState} from "../components/board.component";
import {GameInfo} from "../components/game.component";
import {EndGamePopup} from "../components/ui.component";

export const VictorySystem = (registry: Registry) => {
    const cells: {Cell: Cell}[] = registry.getZipper([Cell]);
    const gameInfoArray: { GameInfo: GameInfo }[] = registry.getZipper([GameInfo]);
    const gameInfo = gameInfoArray[0];

    if (!gameInfo || gameInfo.GameInfo.isGameOver) return;

    const board: CellState[][] = [
        [CellState.Empty, CellState.Empty, CellState.Empty],
        [CellState.Empty, CellState.Empty, CellState.Empty],
        [CellState.Empty, CellState.Empty, CellState.Empty],
    ];

    for (const { Cell } of cells) {
        board[Cell.row]![Cell.col] = Cell.state;
    }

    const winningLines = [
        // Horizontal lines
        [[0,0], [0,1], [0,2]],
        [[1,0], [1,1], [1,2]],
        [[2,0], [2,1], [2,2]],

        // Vertical Lines
        [[0,0], [1,0], [2,0]],
        [[0,1], [1,1], [2,1]],
        [[0,2], [1,2], [2,2]],

        // Diagonal Lines
        [[0,0], [1,1], [2,2]],
        [[0,2], [1,1], [2,0]],
    ];

    let endGameMessage: string = "";

    for (const line of winningLines) {
        const [a, b, c] = line;

        const first = board[a![0]!]![a![1]!];

        if (
            first !== CellState.Empty &&
            first === board[b![0]!]![b![1]!] &&
            first === board[c![0]!]![c![1]!]
        ) {
            gameInfo.GameInfo.isGameOver = true;
            endGameMessage = `Player ${first === CellState.X ? '1' : '2'} win!`
            break;
        }
    }

    const isDraw = board
        .flat()
        .every(cell => cell !== CellState.Empty);

    if (!gameInfo.GameInfo.isGameOver && isDraw) {
        gameInfo.GameInfo.isGameOver = true;
        endGameMessage = "It's a draw!";
    }

    if (gameInfo.GameInfo.isGameOver) {
        const gameOverPopup = registry.spawnEntity();
        registry.addComponent(gameOverPopup, new EndGamePopup(endGameMessage));
    }
}