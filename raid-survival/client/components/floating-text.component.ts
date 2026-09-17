// Marks a free-standing (no ChildrenComponent) Text entity that rises/fades over `duration`
// seconds - not swept by a server "kill" packet's child cascade, purely client-local/ephemeral.
export class FloatingTextComponent {
  name = this.constructor.name;

  constructor(public duration: number) {}

  elapsed: number = 0;
}

// * Required to generate code
export default FloatingTextComponent.name;
