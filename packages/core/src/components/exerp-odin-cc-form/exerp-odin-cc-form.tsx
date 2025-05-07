import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'exerp-odin-cc-form',
  styleUrl: 'exerp-odin-cc-form.css',
  shadow: false,
})
export class ExerpOdinCcForm {

  // 🧑‍💻 Add odinPublicToken prop
  @Prop() odinPublicToken?: string;

  private componentId = `exerp-odin-cc-form-${Math.random().toString(36).substring(2, 9)}`;
  private cardInfoId = `${this.componentId}-card-info`;
  private postalCodeId = `${this.componentId}-postal-code`;
  private submitButtonId = `${this.componentId}-submit-button`;

  componentWillLoad() {
    console.log('[Core Component] componentWillLoad - odinPublicToken:', this.odinPublicToken);
  }

  render() {
    return (
      <div class="exerp-odin-dropin-container">
        {/* 🧑‍💻 Display the received odinPublicToken for verification */}
        {this.odinPublicToken && (
          <div style={{ marginBottom: '10px', padding: '5px', border: '1px solid blue', fontSize: '12px' }}>
            Received Token: <code id="displayed-token">{this.odinPublicToken}</code>
          </div>
        )}

        <div class="odin-field-container">
          <label htmlFor={this.cardInfoId}>Card Information 1</label>
          <div id={this.cardInfoId} class="odin-input"></div>
        </div>

        <div class="odin-field-container">
          <label htmlFor={this.postalCodeId}>Postal Code</label>
          <div id={this.postalCodeId} class="odin-input"></div>
        </div>

        <div class="odin-submit-container">
          <button id={this.submitButtonId} class="odin-submit-button" type="button">
            Pay (Placeholder)
          </button>
        </div>
      </div>
    );
  }
}
