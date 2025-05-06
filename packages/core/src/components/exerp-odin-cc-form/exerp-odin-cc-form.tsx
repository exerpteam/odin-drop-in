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
  // @Prop() first!: string;

  /**
   * The middle name
   */
  // @Prop() middle!: string;

  /**
   * The last name
   */
  // @Prop() last!: string;

  // private getText(): string {
  //   return format(this.first, this.middle, this.last);
  // }

  // 🧑‍💻 Add a unique ID generator or use fixed IDs for the MVP rendering test
  private componentId = `exerp-odin-cc-form-${Math.random().toString(36).substring(2, 9)}`;
  private cardInfoId = `${this.componentId}-card-info`;
  private postalCodeId = `${this.componentId}-postal-code`;
  private submitButtonId = `${this.componentId}-submit-button`;

  render() {
    // 🧑‍💻 Render the basic div structure needed for OdinPay.createCardForm
    //    Based on the MVP requirements and CodePen examples (card + postal code).
    //    We are using unique IDs based on component instance for potential multiple instances later.
    return (
      <div class="exerp-odin-dropin-container">
        {/* Container for Card Number, Expiry, CVC */}
        <div class="odin-field-container">
          <label htmlFor={this.cardInfoId}>Card Information</label>
          <div id={this.cardInfoId} class="odin-input"></div> {/* Target for OdinPay card info */}
        </div>

        {/* Container for Postal Code */}
        <div class="odin-field-container">
          <label htmlFor={this.postalCodeId}>Postal Code</label>
          <div id={this.postalCodeId} class="odin-input"></div> {/* Target for OdinPay postal code */}
        </div>

        {/* Placeholder for Submit Button Area */}
        <div class="odin-submit-container">
          {/* 🧑‍💻 The actual button might be rendered by the host or configured via OdinPay.js later.
            For now, we just need a target ID for the submitButton configuration.
            Let's add a placeholder button inside for visual structure. */}
          <button id={this.submitButtonId} class="odin-submit-button" type="button">
            Pay (Placeholder)
          </button>
        </div>
      </div>
    );
  }
}
