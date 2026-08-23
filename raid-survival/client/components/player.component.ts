export class PlayerComponent {
  name = this.constructor.name;
  id: number;
  username: string;

  constructor(id: number, username: string) {
    this.id = id;
    this.username = username;
  }
}

// * Required to generate code
export default PlayerComponent.name;
