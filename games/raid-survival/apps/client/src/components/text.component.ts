import { Container, Text, TextConfig } from "@nanoforge-dev/graphics-2d";

/**
 * A Konva text added to a parent node.
 *
 * @component
 * @side client
 */
export class TextComponent {
  name = "TextComponent";
  text: Text;

  constructor(
    /** The node the text is added to. */
    parent: Container,
    /** Konva options of the text. */
    options: TextConfig,
  ) {
    this.text = new Text(options);
    parent.add(this.text);
  }
}
