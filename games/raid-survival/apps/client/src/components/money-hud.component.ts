import { Text, Circle } from "@nanoforge-dev/graphics-2d";

/**
 * `amount` is tracked as a plain number (not just baked into the display text) so other systems
 * (build-mode's affordability checks) can read the balance directly. `coinIcon` is a raw Konva
 * node with no SpriteComponent, so zOrderSystem never manages it - needs its own moveToTop().
 *
 * @component
 * @side client
 */
export class MoneyHudComponent {
  name = "MoneyHudComponent";

  constructor(
    /** The amount text. */
    public text: Text,
    /** Coins of the team. */
    public amount: number,
    /** The coin drawn before the amount. */
    public coinIcon: Circle,
  ) {}
}
