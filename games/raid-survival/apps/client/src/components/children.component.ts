import type { Vector } from "@raid-survival/shared/protocol";

export interface ChildrenOptions {
  LocalTransform?: Vector;
}

/**
 * Makes an entity follow another one (`parentId`), at an offset, with `transformChildrenToParentSystem`.
 *
 * @component
 * @side client
 */
export class ChildrenComponent {
  name = "ChildrenComponent";
  parentId: number;
  options: ChildrenOptions;

  constructor(parentId: number, options: ChildrenOptions) {
    this.parentId = parentId;
    this.options = options;
  }
}
