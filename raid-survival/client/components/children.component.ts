import {Vector2d} from "@nanoforge-dev/graphics-2d";

export interface ChildrenOptions {
  LocalPosition?: Vector2d;
}

export class ChildrenComponent {
  name = this.constructor.name;
  parentId: number;
  options: ChildrenOptions;

  constructor(parentId: number, options: ChildrenOptions) {
    this.parentId = parentId;
    this.options = options;
  }
}
