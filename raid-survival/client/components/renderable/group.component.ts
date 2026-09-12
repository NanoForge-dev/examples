import { GroupConfig, Group, Container } from "@nanoforge-dev/graphics-2d";
import { SpriteComponent } from "./sprite.component";

export class GroupComponent {
  name = this.constructor.name;
  group: Group;

  constructor(parent: Container, options: GroupConfig) {
    this.group = new Group(options);
    parent.add(this.group);
  }
}

// * Required to generate code
export default SpriteComponent.name;
