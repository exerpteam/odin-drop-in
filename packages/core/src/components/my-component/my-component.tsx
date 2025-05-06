import { Component, Prop, h } from '@stencil/core';
import { format } from '../../utils/utils';

@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  shadow: true,
})
export class MyComponent {
  /**
   * The first name
   */
  @Prop() first!: string;

  /**
   * The middle name
   */
  @Prop() middle!: string;

  /**
   * The last name
   */
  @Prop() last!: string;

  private getText(): string {
    // 🧑‍💻 Temporarily return a simpler string instead of calling format
    return format(this.first, this.middle, this.last);
    // return `${this.first || ''} ${this.middle || ''} ${this.last || ''}`.trim(); // Simple alternative
  }

  render() {
    return <div>Hello, World! I'm {this.getText()}</div>;
  }
}
