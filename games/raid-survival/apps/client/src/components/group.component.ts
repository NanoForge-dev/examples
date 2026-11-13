import { GroupConfig, Group, Container } from "@nanoforge-dev/graphics-2d";

/**
 * A Konva group added to a parent node, to lay out and move a widget as one.
 *
 * @component
 * @side client
 */
export class GroupComponent {
  name = "GroupComponent";
  group: Group;

  constructor(
    /** The node the group is added to. */
    parent: Container,
    /** Konva options of the group. */
    options: GroupConfig,
  ) {
    this.group = new Group(options);
    parent.add(this.group);
  }
}
