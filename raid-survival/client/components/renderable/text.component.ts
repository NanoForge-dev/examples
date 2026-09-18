import { Container, Text, TextConfig } from "@nanoforge-dev/graphics-2d";

export class TextComponent {
  name = this.constructor.name;
  text: Text;

  constructor(parent: Container, options: TextConfig) {
    this.text = new Text(options);
    parent.add(this.text);
  }
}

// * Required to generate code
export default TextComponent.name;