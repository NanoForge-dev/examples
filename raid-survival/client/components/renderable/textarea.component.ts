import {
  Container,
  document,
  Group,
  Layer,
  Stage,
  Text,
  TextConfig,
} from "@nanoforge-dev/graphics-2d";

export class TextAreaComponent {
  name = this.constructor.name;
  text: Text;
  wrapper: HTMLDivElement;
  textarea: HTMLTextAreaElement;
  value: string = "";
  private readonly clipAncestor: Group | Layer | Stage | null;

  constructor(parent: Container, options: TextConfig) {
    this.text = new Text(options);
    parent.add(this.text);
    this.text.hide();

    this.clipAncestor = this.findClipAncestor(parent);

    this.wrapper = document.createElement("div");
    this.wrapper.style.position = "absolute";
    this.wrapper.style.overflow = "hidden";
    this.wrapper.style.pointerEvents = "none";
    document.body.appendChild(this.wrapper);

    this.textarea = document.createElement("textarea");
    this.textarea.value = this.text.text();
    this.textarea.style.position = "absolute";
    this.textarea.style.border = "none";
    this.textarea.style.padding = "0px";
    this.textarea.style.margin = "0px";
    this.textarea.style.overflow = "hidden";
    this.textarea.style.background = "none";
    this.textarea.style.outline = "none";
    this.textarea.style.resize = "none";
    this.textarea.style.transformOrigin = "left top";
    this.textarea.style.pointerEvents = "auto";
    this.applyTextStyle();
    this.wrapper.appendChild(this.textarea);

    this.textarea.addEventListener("input", () => {
      this.text.text(this.textarea.value);
    });

    this.sync();
  }

  private applyTextStyle(): void {
    const innerHeight = this.text.height() - this.text.padding() * 2;

    this.textarea.style.fontSize = this.text.fontSize() + "px";
    // A single-line textarea centers vertically when its line-height matches the content box's
    // height - the Konva Text's own verticalAlign only affects the hidden `this.text` node, never
    // the actual visible <textarea>, so it has to be replicated here by hand.
    this.textarea.style.lineHeight =
      this.text.verticalAlign() === "middle" ? innerHeight + "px" : this.text.lineHeight().toString();
    this.textarea.style.fontFamily = this.text.fontFamily();
    this.textarea.style.textAlign = this.text.align();
    this.textarea.style.color = (this.text.fill() as string) ?? "#000";
    this.textarea.style.width = this.text.width() - this.text.padding() * 2 + "px";
    // Matches width's formula (box size minus symmetric padding) - the textarea has to actually
    // fill that padded box for the line-height centering trick above to center against the right
    // reference frame, instead of centering inside a shorter box that then sits flush at the top.
    this.textarea.style.height = innerHeight + "px";
  }

  private findClipAncestor(node: Container): Group | Layer | Stage | null {
    let current: Container | null = node;
    while (current) {
      const clipWidth = current.clipWidth?.();
      if (clipWidth) return current as Group | Layer | Stage;
      current = current.getParent();
    }
    return null;
  }

  sync(): void {
    const stage = this.text.getStage();
    if (!stage) return;

    const containerRect = stage.container().getBoundingClientRect();
    const textAbs = this.text.getAbsolutePosition();
    const scale = stage.getAbsoluteScale();
    // width/height above are already inset by padding on both sides (box size minus padding*2) -
    // the position has to be inset by the same padding, on both axes, or the textarea ends up
    // flush against the box's top-left corner with all the slack pushed to the bottom-right
    // instead of the box's content being evenly inset/centered.
    const padding = this.text.padding();

    const pageX = containerRect.left + (textAbs.x + padding) * scale.x;
    const pageY = containerRect.top + (textAbs.y + padding) * scale.y;

    if (this.clipAncestor) {
      const clipRect = this.getAbsoluteClipRect(this.clipAncestor, containerRect, scale);

      this.wrapper.style.left = clipRect.x + "px";
      this.wrapper.style.top = clipRect.y + "px";
      this.wrapper.style.width = clipRect.width + "px";
      this.wrapper.style.height = clipRect.height + "px";

      this.textarea.style.left = pageX - clipRect.x + "px";
      this.textarea.style.top = pageY - clipRect.y + "px";
    } else {
      this.wrapper.style.left = "0px";
      this.wrapper.style.top = "0px";
      this.wrapper.style.width = "100vw";
      this.wrapper.style.height = "100vh";
      this.textarea.style.left = pageX + "px";
      this.textarea.style.top = pageY + "px";
    }

    this.value = this.textarea.value;
  }

  private getAbsoluteClipRect(
    node: Group | Layer | Stage,
    containerRect: DOMRect,
    scale: { x: number; y: number },
  ): { x: number; y: number; width: number; height: number } {
    const n = node;
    const cx = n.clipX?.() ?? 0;
    const cy = n.clipY?.() ?? 0;
    const cw = n.clipWidth?.() ?? node.width();
    const ch = n.clipHeight?.() ?? node.height();

    const topLeft = node.getAbsoluteTransform().point({ x: cx, y: cy });
    const nodeScale = node.getAbsoluteScale();

    return {
      x: containerRect.left + topLeft.x * scale.x,
      y: containerRect.top + topLeft.y * scale.y,
      width: cw * nodeScale.x,
      height: ch * nodeScale.y,
    };
  }

  destroy(): void {
    this.text.destroy();
    this.textarea.remove();
    this.wrapper.remove();
  }
}
