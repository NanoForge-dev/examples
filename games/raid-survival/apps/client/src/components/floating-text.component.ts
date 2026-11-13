/**
 * Marks a free-standing (no ChildrenComponent) Text entity that rises/fades over `duration`
 * seconds - not swept by a server "kill" packet's child cascade, purely client-local/ephemeral.
 *
 * @component
 * @side client
 */
export class FloatingTextComponent {
  name = "FloatingTextComponent";

  constructor(
    /** Seconds before the text is removed. */
    public duration: number,
  ) {}

  elapsed: number = 0;
}
