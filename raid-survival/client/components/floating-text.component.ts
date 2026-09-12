// Marks a free-standing (no ChildrenComponent - it must outlive whatever it's about, so it must
// NOT be swept by kill-packet.handler.ts's child cascade) Text entity as self-timed: rises and
// fades over `duration` seconds, then floating-text.system.ts destroys and kills it itself. Never
// touched by a server "kill" packet - this is purely client-local and ephemeral.
export class FloatingTextComponent {
  name = this.constructor.name;

  constructor(public duration: number) {}

  elapsed: number = 0;
}

// * Required to generate code
export default FloatingTextComponent.name;
