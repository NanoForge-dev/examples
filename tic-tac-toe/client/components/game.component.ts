export class GameInfo {
    name = this.constructor.name;
    isFirstPlayerTurn: boolean = true;
    isGameOver: boolean = false;

    constructor() {
    }
}
