/**
 * The waves of a game, in order: each entry is one wave, each number the zombies of one of its
 * sub-waves, spawned 3 seconds apart.
 */
export const ZOMBIE_WAVES: number[][] = [
  [1, 1, 1, 2, 1],
  [2, 2, 2, 6, 2, 2, 2, 6],
  [3, 3, 3, 6, 3, 3, 3, 6],
  [4, 4, 4, 4, 4, 4, 4, 4],
  [5, 5, 10, 5],
  [50],
];
