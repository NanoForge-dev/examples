// Marker - identifies a player entity for systems that need to single players out (e.g.
// player-death.system.ts), the same way Zombie/Lobby mark their own entities.
export class Player {
  name = this.constructor.name;
}

// * Required to generate code
export default Player.name;
