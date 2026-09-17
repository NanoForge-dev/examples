export interface LobbyPlayer {
  id: number;
  username: string;
  skin: number;
}

export enum LobbyState {
  UNJOINED,
  LOADING,
  JOINED,
}

export enum LobbyAction {
  EMPTY,
  JOIN_LOBBY,
  START_GAME
}

export class LobbyStatusComponent {
  name = this.constructor.name;
  username = "";
  // Chosen character skin (player1.png..player3.png) - sent with the join request.
  skin: number = 1;
  state: LobbyState = LobbyState.UNJOINED;
  action: LobbyAction = LobbyAction.EMPTY;
  players: LobbyPlayer[] = [];
  // Set on a rejected join, rendered by MenuScene, cleared on the next successful join.
  error: string | null = null;
}