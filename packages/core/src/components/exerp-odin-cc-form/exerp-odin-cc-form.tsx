import { Component, Prop, h } from '@stencil/core';
// import { format } from '../../utils/utils';

@Component({
  tag: 'exerp-odin-cc-form',
  styleUrl: 'exerp-odin-cc-form.css', // 🧑‍💻 Update styleUrl
  shadow: false, // 🧑‍💻 Setting shadow: false as per MVP requirements
})
// 🧑‍💻 Update class name
export class ExerpOdinCcForm {

  /**
   * 🧑‍💻 Placeholder prop - replace later with actual props like odinPublicToken
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

  // private getText(): string {
  //   return format(this.first, this.middle, this.last);
  // }

  render() {
    // 🧑‍💻 Simplified render for now - will add ODIN divs later
    return <div>ODIN CC Form Placeholder (Props: {this.first} {this.middle} {this.last})</div>;
  }
}
