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
  // Which of the 3 available character skins (player1.png..player3.png) the player picked in
  // MenuScene's join widget - sent along with the join request and echoed back to everyone via
  // LobbyPlayer.skin so the lobby grid and (eventually) the in-game sprite reflect the choice.
  skin: number = 1;
  state: LobbyState = LobbyState.UNJOINED;
  action: LobbyAction = LobbyAction.EMPTY;
  players: LobbyPlayer[] = [];
  // Set by join-lobby-packet.handler.ts on a rejected join ("full" / "in game"), rendered by
  // MenuScene's join widget, cleared on the next successful join.
  error: string | null = null;
}