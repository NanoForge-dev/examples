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

  constructor(
    /** Entity id of the entity to follow. */
    parentId: number,
    /** The offset, and what of the parent to follow. */
    options: ChildrenOptions,
  ) {
    this.parentId = parentId;
    this.options = options;
  }
}
