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

  constructor(parent: Container, options: TextConfig) {
    this.text = new Text(options);
    parent.add(this.text);
  }
}
