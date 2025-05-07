import { Component, h, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';

// 🧑‍💻 Declare OdinPay at the module level for type safety if you create a .d.ts file for it
//    or use 'any' for now.
declare const OdinPay: any;

// 🧑‍💻 Define payload interfaces for events (can be moved/shared later)
export interface OdinPaySubmitPayload {
  paymentMethodId: string;
  // any other relevant data from OdinPay result.paymentMethod
}

export interface OdinPayErrorPayload {
  message: string; // The primary error information from result.message
  // Synthesized code for internal/facade use?
  code?: 'ODIN_CALLBACK_ERROR' | 'UNEXPECTED_CALLBACK_STRUCTURE' | string;
}

@Component({
  tag: 'exerp-odin-cc-form',
  styleUrl: 'exerp-odin-cc-form.css',
  shadow: false,
})
export class ExerpOdinCcForm {
  // 🧑‍💻 Add odinPublicToken prop
  @Prop() odinPublicToken?: string;
  @Prop() isSingleUse: boolean = true;

  // 🧑‍💻 Define Events that this component will emit
  @Event() odinSubmitInternal!: EventEmitter<OdinPaySubmitPayload>;
  @Event() odinErrorInternal!: EventEmitter<OdinPayErrorPayload>;

  @State() private odinPayInstance: any = null;
  @State() private scriptLoaded: boolean = false;
  @State() private initializationError: string | null = null;
  @State() private formRendered: boolean = false;
  @State() private isLoading: boolean = false;
  @State() private callbackError: string | null = null;

  private componentId = `exerp-odin-cc-form-${Math.random().toString(36).substring(2, 9)}`;
  private cardInfoId = `${this.componentId}-card-info`;
  private postalCodeId = `${this.componentId}-postal-code`;
  private odinSubmitButtonId = `${this.componentId}-odin-submit-button`;
  private visibleSubmitButtonId = `${this.componentId}-visible-submit-button`;

  private loadScript(url: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = url;
      script.id = id;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  }

  async componentDidLoad() {
    console.log('[Core Component] componentDidLoad - odinPublicToken:', this.odinPublicToken);
    if (this.odinPublicToken) {
      await this.initializeOdinPayAndForm();
    }
  }

  @Watch('odinPublicToken')
  async watchOdinPublicToken(newValue: string, oldValue: string) {
    if (newValue && newValue !== oldValue) {
      console.log('[Core Component] odinPublicToken changed, re-initializing OdinPay');
      // 🧑‍💻 Potentially re-initialize or update OdinPay instance if token changes after initial load
      //    For now, we assume it's set once. A more robust solution might unmount/remount.
      await this.initializeOdinPayAndForm();
    }
  }

  private async initializeOdinPayAndForm() {
    this.isLoading = true;
    this.initializationError = null;
    this.callbackError = null;
    this.formRendered = false;
    try {
      if (!this.scriptLoaded) {
        await this.loadScript('https://js.odinpay.net', 'odin-pay-sdk');
        this.scriptLoaded = true;
        console.log('[Core Component] OdinPay.js script loaded.');
      }

      if (typeof OdinPay === 'undefined') {
        this.initializationError = 'OdinPay SDK is not available even after script load.';
        console.error(this.initializationError);
        this.formRendered = false;
        return;
      }

      // 🧑‍💻 Basic theme from CodePen example, can be made configurable via prop later
      const theme = {
        input: {
          base: {
            fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans',
            fontSize: '16px',
          },
          invalid: {
            color: 'red',
            borderColor: 'red',
          },
        },
      };

      this.odinPayInstance = OdinPay(this.odinPublicToken, { ...theme });
      console.log('[Core Component] OdinPay initialized with instance:', this.odinPayInstance);
      this.initializationError = null;

      // Call the method to create the form
      this.renderOdinForm();
    } catch (error) {
      console.error('[Core Component] Error initializing OdinPay:', error);
      this.initializationError = (error as any)?.message || 'Failed to initialize OdinPay.';
      this.odinPayInstance = null;
      this.formRendered = false;
      this.isLoading = false;
    }
  }

  // 🧑‍💻 Method to create the card form using OdinPay.js
  private renderOdinForm() {
    if (!this.odinPayInstance) {
      console.warn('[Core Component] OdinPay instance not available to create form.');
      this.initializationError = 'OdinPay instance is null, cannot render form.';
      this.formRendered = false;
      this.isLoading = false; // 🧑‍💻 Stop loading if instance is missing
      return;
    }

    console.log(`[Core Component] Attempting to create card form. isSingleUse: ${this.isSingleUse}`);
    console.log(`[Core Component] Targeting cardInfoId: #${this.cardInfoId}, postalCodeId: #${this.postalCodeId}, submitButtonId: #${this.odinSubmitButtonId}`);

    try {
      this.odinPayInstance.createCardForm({
        isSingleUse: this.isSingleUse,
        submitButton: {
          selector: this.odinSubmitButtonId,
          callback: (result: any) => {
            console.log('[Core Component] OdinPay submit callback RAW result:', JSON.stringify(result, null, 2));
            this.callbackError = null; // 🧑‍💻 Clear previous callback errors

            if (result && result.success === true && result.paymentMethod && result.paymentMethod.id) {
              console.log('[Core Component] Success! PaymentMethodID:', result.paymentMethod.id);
              // 🧑‍💻 Emit success event
              this.odinSubmitInternal.emit({ paymentMethodId: result.paymentMethod.id });
            } else if (result && result.success === false) {
              // 🧑‍💻 Handle error based on result.message
              const errorMessage = typeof result.message === 'object' ? JSON.stringify(result.message) : result.message;
              console.error('[Core Component] Error from OdinPay callback:', errorMessage);
              this.callbackError = errorMessage || 'Unknown error occurred during submission.'; // 🧑‍💻 Set state to display error
              // 🧑‍💻 Emit error event
              this.odinErrorInternal.emit({
                message: this.callbackError!, // we know it's not null here
                code: 'ODIN_CALLBACK_ERROR', // Use a generic code for now
              });
            } else {
              // 🧑‍💻 Handle unexpected structure
              console.warn('[Core Component] OdinPay callback with unexpected result structure:', result);
              this.callbackError = 'Received an unexpected result structure from OdinPay.'; // 🧑‍💻 Set state
              this.odinErrorInternal.emit({
                message: this.callbackError,
                code: 'UNEXPECTED_CALLBACK_STRUCTURE',
              });
            }
            this.isLoading = false; // 🧑‍💻 Set loading false after callback processing
          },
        },
        fields: {
          cardInformation: {
            selector: this.cardInfoId, // 🧑‍💻 Use the dynamic ID
            // ariaLabel: "Card Details", // Optional
          },
          postalCode: {
            selector: this.postalCodeId, // 🧑‍💻 Use the dynamic ID
            // placeholder: "Postal Code", // Optional
            // ariaLabel: "Billing Postal Code", // Optional
          },
          // 🧑‍💻 Add 'name' field if desired, as per MVP optional recommendation
          // name: {
          //   selector: `${this.componentId}-name-on-card`, // You'll need a div with this ID
          //   placeholder: "Name on Card"
          // }
        },
      });
      console.log('[Core Component] OdinPay createCardForm called successfully.');
      this.formRendered = true; // 🧑‍💻 Set state to indicate form should be rendered
      this.initializationError = null;
      this.isLoading = false; // 🧑‍💻 Set loading false after createCardForm call succeeds
    } catch (error) {
      console.error('[Core Component] Error calling createCardForm:', error);
      this.initializationError = (error as any)?.message || 'Failed to create OdinPay card form.';
      this.formRendered = false;
      this.isLoading = false;
    }
  }

  private handleVisibleSubmitClick = () => {
    console.log('[Core Component] Visible submit button clicked.');
    // 🧑‍💻 Clear previous errors when user tries again
    this.callbackError = null;
    // 🧑‍💻 Set loading state
    this.isLoading = true;

    // 🧑‍💻 Find the hidden button and click it programmatically
    const odinButton = document.getElementById(this.odinSubmitButtonId);
    if (odinButton) {
      console.log('[Core Component] Programmatically clicking hidden Odin button.');
      odinButton.click();
      // Note: isLoading will be set to false inside the OdinPay callback
    } else {
      console.error('[Core Component] Hidden Odin submit button not found!');
      this.callbackError = 'Internal error: Submit button not found.';
      this.odinErrorInternal.emit({ message: this.callbackError, code: 'INTERNAL_ERROR' });
      this.isLoading = false; // Stop loading if we can't proceed
    }
  };

  render() {
    return (
      <div class="exerp-odin-dropin-container">
        {this.initializationError && (
          <div style={{ color: 'red', marginBottom: '10px', border: '1px solid red', padding: '5px' }}>Initialization Error: {this.initializationError}</div>
        )}

        {this.scriptLoaded && !this.initializationError && !this.formRendered && (
          <div style={{ color: 'orange', marginBottom: '10px', border: '1px solid orange', padding: '5px' }}>OdinPay Initialized. Attempting to render form...</div>
        )}
        {this.formRendered && <div style={{ color: 'green', marginBottom: '10px', border: '1px solid green', padding: '5px' }}>OdinPay Form Rendered/Configured Successfully!</div>}

        {/* 🧑‍💻 Display Odin Callback Error */}
        {this.callbackError && (
          <div style={{ color: 'red', marginBottom: '10px', border: '1px solid red', padding: '5px', marginTop: '10px' }}>Submission Error: {this.callbackError}</div>
        )}

        <div class="odin-field-container">
          <label htmlFor={this.cardInfoId}>Card Information</label>
          <div id={this.cardInfoId} class="odin-input">
            {/* OdinPay.js will inject its iframe/input here */}
          </div>
        </div>

        <div class="odin-field-container">
          <label htmlFor={this.postalCodeId}>Postal Code</label>
          <div id={this.postalCodeId} class="odin-input">
            {/* OdinPay.js will inject its iframe/input here */}
          </div>
        </div>

        {/* 🧑‍💻 If you add the 'name' field, you'll need a div for it:
        <div class="odin-field-container">
          <label htmlFor={`${this.componentId}-name-on-card`}>Name on Card</label>
          <div id={`${this.componentId}-name-on-card`} class="odin-input"></div>
        </div>
        */}

        <div class="odin-submit-container">
          {/* 🧑‍💻 VISIBLE Button - User clicks this */}
          <button
            id={this.visibleSubmitButtonId}
            class="odin-submit-button" // Keep existing class for styling
            type="button"
            disabled={this.isLoading || !this.formRendered} // Disable if loading OR if form hasn't rendered
            onClick={this.handleVisibleSubmitClick} // Attach our handler
          >
            {this.isLoading ? 'Loading...' : 'Pay'}
          </button>

          {/* 🧑‍💻 HIDDEN Button - OdinPay targets this */}
          <button
            id={this.odinSubmitButtonId}
            type="button"
            style={{ display: 'none' }} // Hide it visually
            aria-hidden="true"
          ></button>
        </div>
      </div>
    );
  }
}
