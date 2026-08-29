export interface LobbyPlayer {
  id: string;
  username: string;
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
  state: LobbyState = LobbyState.UNJOINED;
  action: LobbyAction = LobbyAction.EMPTY;
  players: LobbyPlayer[] = [];
  // Set by join-lobby-packet.handler.ts on a rejected join ("full" / "in game"), rendered by
  // MenuScene's join widget, cleared on the next successful join.
  error: string | null = null;
}