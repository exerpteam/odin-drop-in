import { Component, h, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';

type LogLevel = 'NONE' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
const DEFAULT_CORE_LOG_LEVEL: LogLevel = 'WARN';

// Declare OdinPay at the module level for type safety if we create a .d.ts file for it
//    or use 'any' for now.
declare const OdinPay: any;

// Details specific to a Card payment method
export interface CardPaymentMethodDetails {
  cardBrand?: string;
  last4?: string; // We'll aim to populate this
  expirationDate?: string;
  binDetails?: any; // Or a more specific type if known
  maskedAccountNumber?: string; // The masked account number from OdinPay.js
}

// Placeholder for future ACH payment method details - define it now for structure
export interface AchPaymentMethodDetails {
  bankAccountType?: 'CHECKING' | 'SAVINGS';
  accountNumberLast4?: string; // OdinPay.js might return masked or last4 directly
  routingNumber?: string; // For US
  transitNumber?: string; // For CA
  institutionNumber?: string; // For CA
  country?: 'US' | 'CA';
}

// Union type for payment method specific details
export type PaymentMethodSpecificDetails = CardPaymentMethodDetails | AchPaymentMethodDetails;

// Define payload interfaces for events
export interface OdinPaySubmitPayload {
  paymentMethodId: string;
  paymentMethodType: 'CARD' | 'BANK_ACCOUNT';
  billingInformation?: OdinPayBillingInformation;
  details?: PaymentMethodSpecificDetails; // Specifically CardPaymentMethodDetails for this CC form
}

export interface OdinPayFieldError {
  field: string; // The name of the field (e.g., "card", "postalCode", "name") or a generic key like "0"
  message: string; // The specific error message for this field
}

export interface OdinPayErrorPayload {
  code: string; // e.g., 'VALIDATION_ERROR', 'API_ERROR', 'GENERAL_ERROR', 'SDK_LOAD_ERROR', etc.
  message: string; // A general, human-readable error message, possibly a summary.
  fieldErrors?: OdinPayFieldError[]; // Optional: For field-specific validation errors
  httpStatusCode?: number; // Optional: For API errors
  rawError?: any; // Optional: For debugging, could include the original result.message
}

// Configuration for enabling and customizing fields
export type BillingFieldsConfig = {
  // Optional fields can be true (enable with defaults) or customized
  [FieldName in OptionalBillingFieldName]?: boolean | FieldCustomization;
} & {
  // Mandatory fields like postalCode can only be customized (they are always implicitly 'true')
  postalCode?: FieldCustomization; // CC
  cardInformation?: FieldCustomization; // CC
  accountNumber?: FieldCustomization; // ACH
  bankAccountType?: FieldCustomization; // ACH - Label for the select
  routingNumber?: FieldCustomization; // ACH - US
  transitNumber?: FieldCustomization; // ACH - CA
  institutionNumber?: FieldCustomization; // ACH - CA
};

// Represents customization for a single field
export interface FieldCustomization {
  label?: string;
  placeholder?: string;
}

// Define the names of fields that can be optionally shown/customized
type OptionalBillingFieldName = 'name' | 'postalCode' | 'addressLine1' | 'addressLine2' | 'city' | 'state' | 'country' | 'emailAddress' | 'phoneNumber';

// Nested address object structure
export interface OdinPayBillingAddress {
  addressLine1?: string; // Present if configured, "" if empty
  addressLine2?: string; // Present if configured, "" if empty
  city?: string; // Present if configured, "" if empty
  state?: string; // Present if configured, "" if empty
  postalCode?: string; // Present if configured, "" if empty
  country?: string; // Present if configured, "" if empty
}

// Top-level billing information structure
export interface OdinPayBillingInformation {
  name?: string; // Present if configured, "" if empty
  emailAddress?: string; // Present if configured, "" if empty
  phoneNumber?: string; // Present if configured, "" if empty
  address?: OdinPayBillingAddress; // Present if ANY address field was configured
}

// Define default labels and placeholders
const DEFAULT_FIELD_TEXT: { [key: string]: FieldCustomization } = {
  cardInformation: { label: 'Card Information', placeholder: undefined },
  name: { label: 'Name on Card', placeholder: 'Full Name' },
  postalCode: { label: 'Postal Code', placeholder: 'Postal Code' }, // Placeholder might vary by country in OdinPay.js itself
  addressLine1: { label: 'Address Line 1', placeholder: 'Street Address' },
  addressLine2: { label: 'Address Line 2 (Optional)', placeholder: 'Apartment, suite, etc.' },
  city: { label: 'City', placeholder: 'City' },
  state: { label: 'State / Province', placeholder: 'State / Province' }, // Label accommodates US/CA
  country: { label: 'Country', placeholder: 'Country' }, // Placeholder might be less useful if OdinPay renders a dropdown
  emailAddress: { label: 'Email Address', placeholder: 'you@example.com' },
  phoneNumber: { label: 'Phone Number', placeholder: '(123) 456-7890' },

  // ACH Specific Defaults
  accountNumber: { label: 'Account Number', placeholder: 'Account Number' },
  bankAccountType: { label: 'Account Type', placeholder: 'Select Account Type' }, // Placeholder for the select prompt
  routingNumber: { label: 'Routing Number', placeholder: 'Routing Number' }, // US
  transitNumber: { label: 'Transit Number', placeholder: 'Transit Number' }, // CA
  institutionNumber: { label: 'Institution Number', placeholder: 'Institution Number' }, // CA
};

@Component({
  tag: 'exerp-odin-cc-form',
  styleUrl: 'exerp-odin-cc-form.css',
  shadow: false,
})
export class ExerpOdinCcForm {
  /**
   * The short-lived public token obtained from the ODIN backend,
   * required to initialize the OdinPay.js library.
   * Passed down from the facade.
   */
  @Prop() odinPublicToken?: string;

  /**
   * Specifies the type of payment method the form should handle.
   * 'CARD' will render the credit card form.
   * 'ACH' will render the bank account (ACH) form.
   * @defaultValue 'CARD'
   */
  @Prop() paymentMethodType: 'CARD' | 'ACH' = 'CARD';

  /**
   * The country code ('US' or 'CA') for which the payment form should be configured.
   * This is mandatory and passed to OdinPay.js.
   */
  @Prop() countryCode!: 'US' | 'CA'; // Making it mandatory and specific

  /**
   * Optional configuration to enable and customize billing fields.
   * This object determines which optional billing fields are rendered and allows
   * overriding their default labels and placeholders.
   *
   * - For optional fields (e.g., `name`, `addressLine1`):
   *   - `true`: Enables the field with default label and placeholder.
   *   - `FieldCustomization` object (e.g., `{ label?: 'Custom Label', placeholder?: 'Custom Hint' }`):
   *     Enables the field and applies the specified customizations.
   *   - If a field key is omitted, the field is not rendered.
   *
   * - For fields that are always structurally part of the form but can be customized
   *   (e.g., `postalCode` label/placeholder, `cardInformation` label):
   *   - Provide a `FieldCustomization` object to override default texts.
   *
   * Example:
   * `{
   *   name: true, // Enable 'Name on Card' with defaults
   *   addressLine1: { label: 'Street Address Line 1' }, // Custom label for address
   *   city: { placeholder: 'Enter your city here' }, // Custom placeholder for city
   *   postalCode: { label: 'Zip/Postal' } // Custom label for postal code
   * }`
   *
   * Refer to the `BillingFieldsConfig` and `FieldCustomization` type definitions
   * within this file for the exact structure and available field names.
   */
  @Prop() billingFieldsConfig?: BillingFieldsConfig;

  /**
   * Controls the level of logging output to the browser console.
   * Passed down from the facade.
   * Defaults to 'WARN'.
   * @defaultValue 'WARN'
   * @since x.y.z - Add version when released
   */
  @Prop() logLevel: LogLevel = DEFAULT_CORE_LOG_LEVEL;

  /**
   * Optional theme configuration object passed from the facade.
   * This object should conform to OdinPay.js v2's flat theme structure.
   * @internal
   */
  @Prop() themeConfigProp?: any; // For now, 'any'. Facade ensures correct structure.

  /**
   * Fired when OdinPay.js successfully returns a payment method token
   * after the user submits the form. The event detail contains the
   * `paymentMethodId` and, if applicable, the `billingInformation`
   * collected from the form.
   */
  @Event() odinSubmitInternal!: EventEmitter<OdinPaySubmitPayload>;

  /**
   * Fired when OdinPay.js returns an error during submission
   * or if an internal setup error occurs. Contains the error message.
   */
  @Event() odinErrorInternal!: EventEmitter<OdinPayErrorPayload>;

  /**
   * Optional callback function passed from the facade, to be invoked by OdinPay.js v2
   * during real-time field validation.
   * The event payload should be compatible with OdinFieldValidationEvent defined in the facade.
   * @internal
   */
  @Prop() onChangeValidation?: (event: any) => void; // Using 'any' for now, facade ensures correct type

  @State() private odinPayInstance: any = null;
  @State() private scriptLoaded: boolean = false;
  @State() private initializationError: string | null = null;
  @State() private isLoading: boolean = false;
  @State() private odinFormRenderedBySDK: boolean = false;

  private readonly LogLevelSeverity: Record<LogLevel, number> = {
    NONE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
  };

  private isLogLevelEnabled(messageLevel: LogLevel): boolean {
    return this.LogLevelSeverity[messageLevel] <= this.LogLevelSeverity[this.logLevel];
  }

  private log(messageLevel: LogLevel, ...messages: any[]) {
    if (this.isLogLevelEnabled(messageLevel)) {
      const prefix = `[Core][${messageLevel}]`;
      switch (messageLevel) {
        case 'ERROR':
          console.error(prefix, ...messages);
          break;
        case 'WARN':
          console.warn(prefix, ...messages);
          break;
        case 'INFO':
          console.info(prefix, ...messages);
          break;
        case 'DEBUG':
          console.debug(prefix, ...messages);
          break;
      }
    }
  }

  private componentId = `exerp-odin-cc-form-${Math.random().toString(36).substring(2, 9)}`;

  /** Helper to check if a field should be rendered */
  private isFieldEnabled(fieldName: keyof BillingFieldsConfig): boolean {
    return !!this.billingFieldsConfig?.[fieldName];
  }

  /** Helper to get the customization object for a field */
  private getFieldCustomization(fieldName: keyof BillingFieldsConfig): FieldCustomization | undefined {
    const configValue = this.billingFieldsConfig?.[fieldName];
    return typeof configValue === 'object' ? configValue : undefined;
  }

  /** Helper to get the label for a field */
  private getLabel(fieldName: keyof BillingFieldsConfig): string {
    const customLabel = this.getFieldCustomization(fieldName)?.label;
    if (fieldName === 'name' && !customLabel) {
      return this.paymentMethodType === 'ACH' ? 'Account Holder Name' : DEFAULT_FIELD_TEXT['name'].label!;
    }
    return customLabel ?? DEFAULT_FIELD_TEXT[fieldName]?.label ?? fieldName; // Fallback to fieldName if no default
  }

  /** Helper to get the placeholder for a field */
  private getPlaceholder(fieldName: keyof BillingFieldsConfig): string | undefined {
    const customPlaceholder = this.getFieldCustomization(fieldName)?.placeholder;
    // Return custom placeholder, default placeholder, or undefined if neither exists
    return customPlaceholder ?? DEFAULT_FIELD_TEXT[fieldName]?.placeholder ?? undefined;
  }

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
    this.log('INFO', 'componentDidLoad - Props:', {
      // Log object for readability
      odinPublicTokenProvided: !!this.odinPublicToken,
      countryCode: this.countryCode,
      logLevel: this.logLevel,
    }); // Check for countryCode before initializing
    if (this.odinPublicToken && this.countryCode) {
      await this.initializeOdinPayAndForm();
    } else if (!this.countryCode) {
      const errorMsg = 'countryCode prop is missing. Cannot initialize OdinPay.';
      this.log('ERROR', errorMsg);
      this.initializationError = errorMsg;
      this.odinErrorInternal.emit({ message: errorMsg, code: 'INIT_NO_COUNTRY_CODE' });
      this.isLoading = false;
    }
  }

  @Watch('odinPublicToken')
  async watchOdinPublicToken(newValue: string, oldValue: string) {
    if (newValue && newValue !== oldValue) {
      this.log('DEBUG', 'odinPublicToken changed, re-initializing OdinPay. Current countryCode:', this.countryCode);
      // Check for countryCode before re-initializing
      if (this.countryCode) {
        await this.initializeOdinPayAndForm();
      } else {
        const errorMsg = 'countryCode prop is missing on token change. Cannot re-initialize OdinPay.';
        this.log('ERROR', errorMsg);
        // Optionally emit an error or handle as appropriate
        this.initializationError = errorMsg;
        this.odinErrorInternal.emit({ message: errorMsg, code: 'INIT_NO_COUNTRY_CODE_ON_UPDATE' });
        this.isLoading = false;
      }
    }
  }

  @Watch('countryCode')
  async watchCountryCode(newValue: string, oldValue: string) {
    if (newValue && newValue !== oldValue && this.odinPublicToken) {
      this.log('DEBUG', 'countryCode changed, re-initializing OdinPay. New value:', newValue);
      await this.initializeOdinPayAndForm();
    } else if (!newValue && this.odinPublicToken) {
      const errorMsg = 'countryCode prop was unset. Cannot re-initialize OdinPay.';
      this.log('ERROR', errorMsg);
      this.initializationError = errorMsg;
      this.odinErrorInternal.emit({ message: errorMsg, code: 'INIT_NO_COUNTRY_CODE_ON_UPDATE' });
      this.isLoading = false;
    }
  }

  private async _ensureOdinPayScriptLoaded(): Promise<void> {
    if (this.scriptLoaded) {
      return;
    }
    try {
      await this.loadScript('https://js.odin-dev.com', 'odin-pay-sdk'); // TODO: Update to production v2 URL (e.g., https://js.odinpay.net or specific v2.x.x) when live
      this.scriptLoaded = true;
      this.log('INFO', 'OdinPay.js script loaded.');
    } catch (error) {
      this.log('ERROR', 'Failed to load OdinPay.js script:', error);
      this.initializationError = 'Failed to load OdinPay.js SDK.'; // User-friendly message
      // THROWING the error so the caller (initializeOdinPayAndForm) can catch and emit odinErrorInternal
      throw new Error(this.initializationError);
    }
  }

  // private method to handle OdinPay instantiation
  private _instantiateOdinPay(): void {
    if (typeof OdinPay === 'undefined') {
      this.initializationError = 'OdinPay SDK is not available even after script load.';
      this.log('ERROR', this.initializationError);
      throw new Error(this.initializationError);
    }

    let effectiveTheme: any; // Use 'any' for flexibility or define a core-specific type

    if (this.themeConfigProp && Object.keys(this.themeConfigProp).length > 0) {
      this.log('DEBUG', '[Core] Using theme provided via themeConfigProp:', JSON.stringify(this.themeConfigProp));
      effectiveTheme = this.themeConfigProp;
    } else {
      // Fallback to an empty theme object
      this.log('DEBUG', '[Core] No themeConfigProp provided or empty. Passing empty theme object {} to OdinPay.js to use its defaults.');
      effectiveTheme = {}; // Let OdinPay.js apply its own full default theme
    }

    const odinPayOptions = {
      country: this.countryCode,
      theme: effectiveTheme,
    };
    this.log('DEBUG', `About to call OdinPay(). Token provided: ${!!this.odinPublicToken}`, `Options:`, JSON.stringify(odinPayOptions));

    try {
      this.odinPayInstance = OdinPay(this.odinPublicToken, odinPayOptions);
      this.log('INFO', 'OdinPay initialized with instance:', this.odinPayInstance);
      this.initializationError = null; // Clear any previous init error on successful instantiation
    } catch (odinConstructorError: any) {
      this.log('ERROR', 'Error DIRECTLY from OdinPay() constructor:', odinConstructorError);
      this.odinPayInstance = null;
      // THROWING the error, potentially re-wrapping if needed, or just letting it propagate
      throw odinConstructorError; // The original error is likely more informative
    }
  }

  private async initializeOdinPayAndForm() {
    this.isLoading = true;
    this.initializationError = null;
    this.odinFormRenderedBySDK = false;

    if (!this.countryCode) {
      const errorMsg = 'Internal Error: countryCode is missing in initializeOdinPayAndForm.';
      this.log('ERROR', errorMsg);
      this.initializationError = errorMsg;
      this.odinErrorInternal.emit({ message: errorMsg, code: 'INIT_NO_COUNTRY_CODE_INTERNAL' });
      this.isLoading = false;
      return;
    }

    try {
      await this._ensureOdinPayScriptLoaded();
      this._instantiateOdinPay(); // This will throw if OdinPay instantiation fails

      // If instantiation was successful, proceed to create the form
      this._createOdinPayForm();
    } catch (error: any) {
      this.log('ERROR', 'RAW Error object during OdinPay initialization or script loading:', error);
      const errorMessage = error?.message || 'Failed to initialize OdinPay.';
      this.log('ERROR', 'Error message during OdinPay initialization:', errorMessage);
      this.initializationError = errorMessage;

      let specificErrorCode = 'INITIALIZATION_ERROR';
      if (errorMessage === 'Failed to load OdinPay.js SDK.') {
        specificErrorCode = 'SDK_LOAD_ERROR';
      } else if (errorMessage === 'OdinPay SDK is not available even after script load.') {
        specificErrorCode = 'SDK_NOT_DEFINED_ERROR'; // More specific than SDK_LOAD_ERROR for this case
      } else if (errorMessage === 'No key provided') {
        specificErrorCode = 'INIT_NO_KEY_PROVIDED';
      } else if (errorMessage === 'Badly formatted key') {
        specificErrorCode = 'INIT_BADLY_FORMATTED_KEY';
      } else if (errorMessage === 'Invalid Key') {
        specificErrorCode = 'INIT_INVALID_KEY_STRUCTURE';
      } else if (errorMessage.startsWith('Unsupported country')) {
        specificErrorCode = 'INIT_UNSUPPORTED_COUNTRY';
      } else if (errorMessage.includes('BasisTheoryElements') || errorMessage.includes('Elements script') || errorMessage.includes('API key is required')) {
        specificErrorCode = 'INIT_BT_SDK_FAILURE';
      }

      const errorPayload: OdinPayErrorPayload = {
        code: specificErrorCode,
        message: errorMessage,
        rawError: error,
      };
      this.odinErrorInternal.emit(errorPayload);

      this.odinPayInstance = null;
      this.isLoading = false;
    }
  }

  // private method to build fields configuration for card form
  private _buildCardFormFieldsConfig(): any {
    // OdinPay.js expects 'any' here
    const odinPayFields: any = {
      cardInformation: {
        selector: this.getFieldId('cardInformation'),
      },
      postalCode: {
        selector: this.getFieldId('postalCode'),
        placeholder: this.getPlaceholder('postalCode'),
      },
    };

    const optionalFieldMapping: { [key in OptionalBillingFieldName]: string } = {
      name: this.getFieldId('name'),
      postalCode: this.getFieldId('postalCode'),
      addressLine1: this.getFieldId('addressLine1'),
      addressLine2: this.getFieldId('addressLine2'),
      city: this.getFieldId('city'),
      state: this.getFieldId('state'),
      country: this.getFieldId('country'),
      emailAddress: this.getFieldId('emailAddress'),
      phoneNumber: this.getFieldId('phoneNumber'),
    };

    for (const fieldNameKey in optionalFieldMapping) {
      const fieldName = fieldNameKey as OptionalBillingFieldName; // Cast to be sure
      if (fieldName === 'postalCode') continue;

      if (this.isFieldEnabled(fieldName)) {
        odinPayFields[fieldName] = {
          selector: optionalFieldMapping[fieldName],
          placeholder: this.getPlaceholder(fieldName),
        };
      }
    }
    this.log('DEBUG', 'Final fields object for createCardForm:', JSON.stringify(odinPayFields, null, 2));
    return odinPayFields;
  }

  // Method to create the card form using OdinPay.js
  private _createOdinPayForm() {
    if (!this.odinPayInstance) {
      this.log('WARN', 'OdinPay instance not available to create form.');
      if (!this.initializationError) {
        // Defensive set if somehow missed
        this.initializationError = 'OdinPay instance is null, cannot render form.';
        this.odinErrorInternal.emit({ message: this.initializationError, code: 'INSTANCE_NULL' });
      }
      this.odinFormRenderedBySDK = false;
      this.isLoading = false;
      return;
    }

    this.log('DEBUG', `Attempting to create form for paymentMethodType: ${this.paymentMethodType}.`);
    this.isLoading = true;

    if (this.paymentMethodType === 'ACH') {
      this.log('INFO', 'ACH form creation selected. Calling _createOdinPayBankAccountForm()');
      this._createOdinPayBankAccountForm(); // We will create this method next
    } else {
      // Default to CARD
      this.log('INFO', 'CARD form creation selected. Calling _createOdinPayCardForm()');
      this._createOdinPayCardForm(); // We will refactor existing logic into this method
    }
  }

  private _createOdinPayCardForm() {
    this.log('DEBUG', `[Core] Creating CARD form.`);

    const odinPayCardFormFields = this._buildCardFormFieldsConfig();

    try {
      this.odinPayInstance.createCardForm({
        submitButton: {
          selector: this.getFieldId('odinSubmitButton'),
          callback: (result: any) => {
            this.log('DEBUG', 'OdinPay CARD submit callback RAW result:', JSON.stringify(result, null, 2));
            if (result && result.success === true && result.paymentMethod && result.paymentMethod.id) {
              this._handleOdinPaySuccessCallback(result);
            } else if (result && result.success === false) {
              this._handleOdinPayErrorCallback(result);
            } else {
              this.log('ERROR', 'OdinPay CARD callback with unexpected result structure:', result);
              this.odinErrorInternal.emit({
                message: 'Received an unexpected result structure from OdinPay (Card).',
                code: 'UNEXPECTED_CALLBACK_STRUCTURE_CARD',
              });
            }
            this.isLoading = false;
          },
        },
        fields: odinPayCardFormFields,
        onChangeValidation: this._handleOdinPayOnChangeValidation.bind(this),
      });
      this.log('INFO', 'OdinPay createCardForm called successfully.');
      this.initializationError = null;
      this.odinFormRenderedBySDK = true;
      this.isLoading = false;
    } catch (error) {
      this.log('ERROR', 'Error calling createCardForm:', error);
      this.initializationError = (error as any)?.message || 'Failed to create OdinPay card form.';
      this.odinErrorInternal.emit({ message: this.initializationError!, code: 'CREATE_FORM_ERROR_CARD' });
      this.odinFormRenderedBySDK = false;
      this.isLoading = false;
    }
  }

  private _createOdinPayBankAccountForm() {
    if (!this.odinPayInstance) {
      this.log('WARN', 'OdinPay instance not available to create bank account form.');
      if (!this.initializationError) {
        this.initializationError = 'OdinPay instance is null, cannot render bank account form.';
        this.odinErrorInternal.emit({ message: this.initializationError, code: 'INSTANCE_NULL_ACH' });
      }
      this.odinFormRenderedBySDK = false;
      this.isLoading = false;
      return;
    }
    this.log('DEBUG', `[Core] Creating BANK_ACCOUNT form.`);
    // isLoading is already true

    const odinPayBankAccountFormFields = this._buildBankAccountFormFieldsConfig();

    try {
      this.odinPayInstance.createBankAccountForm({
        submitButton: {
          selector: this.getFieldId('odinSubmitButton'),
          callback: (result: any) => {
            this.log('DEBUG', '[Core] OdinPay BANK_ACCOUNT submit callback RAW result:', JSON.stringify(result, null, 2));
            if (result && result.success === true && result.paymentMethod && result.paymentMethod.id) {
              this._handleOdinPaySuccessCallback(result);
            } else if (result && result.success === false) {
              this._handleOdinPayErrorCallback(result);
            } else {
              this.log('ERROR', '[Core] OdinPay BANK_ACCOUNT callback with unexpected result structure:', result);
              this.odinErrorInternal.emit({
                message: 'Received an unexpected result structure from OdinPay (ACH).',
                code: 'UNEXPECTED_CALLBACK_STRUCTURE_ACH',
              });
            }
            this.isLoading = false;
          },
        },
        fields: odinPayBankAccountFormFields,
        onChangeValidation: this._handleOdinPayOnChangeValidation.bind(this),
      });
      this.log('INFO', '[Core] OdinPay createBankAccountForm called successfully.');
      this.initializationError = null;
      this.odinFormRenderedBySDK = true;
      this.isLoading = false;
    } catch (error) {
      this.log('ERROR', '[Core] Error calling createBankAccountForm:', error);
      this.initializationError = (error as any)?.message || 'Failed to create OdinPay bank account form.';
      this.odinErrorInternal.emit({ message: this.initializationError!, code: 'CREATE_FORM_ERROR_ACH', rawError: error });
      this.odinFormRenderedBySDK = false;
      this.isLoading = false;
    }
  }

  private _buildBankAccountFormFieldsConfig(): any {
    // OdinPay.js expects 'any' for fields config
    this.log('DEBUG', '[Core] Building BANK_ACCOUNT form fields config for country:', this.countryCode);

    const fields: any = {
      accountNumber: {
        selector: this.getFieldId('accountNumber'),
        placeholder: this.getPlaceholder('accountNumber'), // Use our helper
      },
      bankAccountType: {
        // This selector is for the container where OdinPay.js will create the <select>
        selector: this.getFieldId('bankAccountTypeContainer'),
        // placeholder for bankAccountType (if used by OdinPay.js for a prompt option) can be set via getPlaceholder
        placeholder: this.getPlaceholder('bankAccountType'),
        // initialValue could also be supported if desired: this.billingFieldsConfig?.bankAccountType?.initialValue
      },
      name: {
        // This is 'Account Holder Name'
        selector: this.getFieldId('accountHolderName'),
        placeholder: this.getPlaceholder('name'), // Assumes 'name' key in DEFAULT_FIELD_TEXT is "Account Holder Name" when paymentMethodType is ACH, or user customizes
        // initialValue: this.billingFieldsConfig?.name?.initialValue // if supporting initial values
      },
    };

    if (this.countryCode === 'US') {
      fields.routingNumber = {
        selector: this.getFieldId('routingNumber'),
        placeholder: this.getPlaceholder('routingNumber'),
      };
    } else if (this.countryCode === 'CA') {
      fields.transitNumber = {
        selector: this.getFieldId('transitNumber'),
        placeholder: this.getPlaceholder('transitNumber'),
      };
      fields.institutionNumber = {
        selector: this.getFieldId('institutionNumber'),
        placeholder: this.getPlaceholder('institutionNumber'),
      };
    }

    // Add optional billing fields (address, email, phone)
    // These are standard HTML inputs managed by OdinPay.js
    const optionalBillingFieldKeys: OptionalBillingFieldName[] = ['addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country', 'emailAddress', 'phoneNumber'];

    optionalBillingFieldKeys.forEach(fieldKey => {
      if (this.isFieldEnabled(fieldKey)) {
        fields[fieldKey] = {
          selector: this.getFieldId(fieldKey), // Ensure your renderAchFields creates these IDs
          placeholder: this.getPlaceholder(fieldKey),
          // initialValue: this.billingFieldsConfig?.[fieldKey]?.initialValue // if supporting initial values
        };
      }
    });

    this.log('DEBUG', '[Core] Final Bank account fields config:', JSON.stringify(fields));
    return fields;
  }

  private _handleOdinPayOnChangeValidation(fieldInformation: any) {
    // fieldInformation is the object directly from OdinPay.js v2
    // e.g., { type: "FIELD_VALIDATION", fieldName: string, selector: string, isValid: boolean, errorCode?: string }

    if (typeof this.log !== 'function') {
      console.error('[Core Error] Critical: `this.log` is not a function inside _handleOdinPayOnChangeValidation. `this` is:', this);
      // Cannot proceed if `this` is not the component instance.
      return;
    }

    if (this.onChangeValidation) {
      // this.onChangeValidation is the @Prop()
      // If a callback was provided from the facade, call it
      this.log('DEBUG', '[Core] Forwarding onChangeValidation event to facade:', fieldInformation);
      try {
        this.onChangeValidation(fieldInformation);
      } catch (e) {
        this.log('ERROR', '[Core] Error calling user-provided onChangeValidation callback from facade:', e);
      }
    } else {
      // Default behavior: No-op or minimal logging if no facade callback
      this.log('DEBUG', '[Core] OdinPay.js onChangeValidation triggered (no user callback provided):', fieldInformation);
    }
  }

  // private method to handle successful OdinPay callback
  private _handleOdinPaySuccessCallback(result: any) {
    // result from OdinPay.js
    const odinPayPM = result.paymentMethod; // Alias for readability
    const paymentMethodTypeFromOdin = odinPayPM?.type?.toUpperCase();
    this.log('DEBUG', `[Core] Success callback. OdinPay type: ${paymentMethodTypeFromOdin}, PM_ID:`, odinPayPM.id);
    this.log('DEBUG', '[Core] Full paymentMethod object from OdinPay.js:', JSON.stringify(odinPayPM, null, 2));

    let billingInfo: OdinPayBillingInformation | undefined = undefined;
    if (odinPayPM.billingInformation) {
      billingInfo = odinPayPM.billingInformation as OdinPayBillingInformation;
      this.log('DEBUG', '[Core] Extracted billingInformation:', JSON.stringify(billingInfo, null, 2));
    } else {
      this.log('DEBUG', '[Core] No billingInformation found in OdinPay result.paymentMethod.');
    }

    let specificDetails: PaymentMethodSpecificDetails | undefined = undefined;
    let submitPayloadType: 'CARD' | 'BANK_ACCOUNT'; // This will be strictly set

    if (paymentMethodTypeFromOdin === 'CREDIT_CARD') {
      // OdinPay.js v2 often uses "CREDIT_CARD"
      submitPayloadType = 'CARD';
      const cardDetails: CardPaymentMethodDetails = {};
      if (odinPayPM.cardBrand) cardDetails.cardBrand = odinPayPM.cardBrand;
      if (odinPayPM.accountNumber) {
        // This is the masked card number for CC
        cardDetails.maskedAccountNumber = String(odinPayPM.accountNumber);
        if (cardDetails.maskedAccountNumber.length >= 4) {
          cardDetails.last4 = cardDetails.maskedAccountNumber.slice(-4);
        } else {
          cardDetails.last4 = cardDetails.maskedAccountNumber; // Should not happen for cards
        }
      }
      if (odinPayPM.expirationDate) cardDetails.expirationDate = odinPayPM.expirationDate;
      if (odinPayPM.binDetails) cardDetails.binDetails = odinPayPM.binDetails;
      specificDetails = cardDetails;
      this.log('DEBUG', '[Core] Extracted CARD details for submit payload:', JSON.stringify(specificDetails, null, 2));
    } else if (paymentMethodTypeFromOdin === 'BANK_ACCOUNT') {
      submitPayloadType = 'BANK_ACCOUNT';
      const achDetails: AchPaymentMethodDetails = {};
      if (odinPayPM.bankAccountType) achDetails.bankAccountType = odinPayPM.bankAccountType;
      if (odinPayPM.accountNumber) {
        // This is the masked account number for ACH
        const maskedAcctNum = String(odinPayPM.accountNumber);
        if (maskedAcctNum.length >= 4) {
          achDetails.accountNumberLast4 = maskedAcctNum.slice(-4);
        } else {
          achDetails.accountNumberLast4 = maskedAcctNum;
        }
      }
      if (odinPayPM.routingNumber) achDetails.routingNumber = odinPayPM.routingNumber; // US
      if (odinPayPM.transitNumber) achDetails.transitNumber = odinPayPM.transitNumber; // CA
      if (odinPayPM.institutionNumber) achDetails.institutionNumber = odinPayPM.institutionNumber; // CA
      if (odinPayPM.country) achDetails.country = odinPayPM.country as 'US' | 'CA';
      specificDetails = achDetails;
      this.log('DEBUG', '[Core] Extracted BANK_ACCOUNT details for submit payload:', JSON.stringify(specificDetails, null, 2));
    } else {
      this.log('ERROR', `[Core] Unknown payment method type from OdinPay.js callback: ${paymentMethodTypeFromOdin}. Emitting error.`);
      this.odinErrorInternal.emit({
        code: 'UNKNOWN_PAYMENT_METHOD_TYPE',
        message: `Received an unknown payment method type '${paymentMethodTypeFromOdin}' from OdinPay.`,
        rawError: odinPayPM,
      });
      return; // Do not proceed to emit success for unknown type
    }

    const submitPayload: OdinPaySubmitPayload = {
      paymentMethodId: odinPayPM.id,
      paymentMethodType: submitPayloadType,
      billingInformation: billingInfo,
      details: specificDetails,
    };
    // Optionally add createdAt, updatedAt if desired and present in odinPayPM
    // if (odinPayPM.createdAt) (submitPayload as any).createdAt = odinPayPM.createdAt;
    // if (odinPayPM.updatedAt) (submitPayload as any).updatedAt = odinPayPM.updatedAt;

    this.log('INFO', '[Core] Emitting odinSubmitInternal with payload:', JSON.stringify(submitPayload, null, 2));
    this.odinSubmitInternal.emit(submitPayload);
  }

  private _handleOdinPayErrorCallback(result: any) {
    if (result && result.errors && Array.isArray(result.errors)) {
      this.log('DEBUG', '[Core] OdinPay v2 `result.errors` detected. Will be processed by _parseOdinPayError.');
    } else if (result && result.success === false) {
      this.log('DEBUG', '[Core] `result.errors` not found or not an array, but result.success is false. _parseOdinPayError will process `result.message`.');
    }
    const parsedErrorPayload = this._parseOdinPayError(result);
    this.odinErrorInternal.emit(parsedErrorPayload);
  }

  private handleVisibleSubmitClick = () => {
    this.log('DEBUG', 'Visible submit button clicked.');

    // --- Guard against submission if not properly initialized/rendered ---
    if (this.isLoading || !this.odinPayInstance || !this.odinFormRenderedBySDK || this.initializationError) {
      this.log(
        'WARN',
        '[Core Component] Submission prevented. isLoading:',
        this.isLoading,
        'hasInstance:',
        !!this.odinPayInstance,
        'formRendered:',
        this.odinFormRenderedBySDK,
        'initError:',
        this.initializationError,
      );
      // Optionally, re-emit the initializationError if it exists, or a new error
      if (this.initializationError) {
        this.odinErrorInternal.emit({ message: `Cannot submit: ${this.initializationError}`, code: 'SUBMIT_WHILE_INIT_ERROR' });
      } else if (!this.odinPayInstance || !this.odinFormRenderedBySDK) {
        this.odinErrorInternal.emit({ message: 'Cannot submit: Form not ready.', code: 'FORM_NOT_READY' });
      }
      return;
    }

    // Set loading state
    this.isLoading = true;

    // Find the hidden button and click it programmatically
    const odinButton = document.getElementById(this.getFieldId('odinSubmitButton'));
    if (odinButton) {
      this.log('DEBUG', 'Programmatically clicking hidden Odin button.');
      odinButton.click();
      // Note: isLoading will be set to false inside the OdinPay callback
    } else {
      this.log('ERROR', 'Hidden Odin submit button not found!');
      this.odinErrorInternal.emit({ message: 'Internal error: Submit button not found.', code: 'INTERNAL_ERROR' });
      this.isLoading = false; // Stop loading if we can't proceed
    }
  };

  private _parseOdinPayError(odinResult: any): OdinPayErrorPayload {
    let code = 'ODIN_CALLBACK_ERROR'; // Default code
    let generalMessage = 'An error occurred during payment processing.';
    const fieldErrors: OdinPayFieldError[] = [];
    let httpStatusCode: number | undefined;

    if (odinResult && odinResult.errors && Array.isArray(odinResult.errors) && odinResult.errors.length > 0) {
      this.log('DEBUG', '[Core] Parsing errors from `result.errors` (OdinPay.js v2).');
      code = 'VALIDATION_ERROR_FIELDS'; // Default for multiple field errors
      generalMessage = 'Validation failed. Please check the fields highlighted.'; // Default message for v2 field errors

      odinResult.errors.forEach((v2Error: any) => {
        // Attempt to map v2Error to our OdinPayFieldError structure
        // Common v2 ErrorObject structure: { selector: string, errorCode: string, fieldName: string, type: "FIELD_VALIDATION" | "BACKEND" }
        // We primarily care about fieldName and a descriptive message based on errorCode.
        // The 'message' property isn't directly in the v2 ErrorObject, we'll derive it or use errorCode.

        let fieldKey = v2Error.fieldName || v2Error.selector || 'unknownField'; // Prefer fieldName
        let errorMessage = v2Error.errorCode || 'Unknown validation error'; // Use errorCode as message for now

        // We might want to map v2Error.errorCode to more user-friendly messages later
        // e.g., if (v2Error.errorCode === 'REQUIRED') errorMessage = 'This field is required.';
        // For now, using errorCode directly is a good start.

        fieldErrors.push({
          field: fieldKey,
          message: errorMessage,
        });

        // If we encounter a "BACKEND" type error, it's likely more serious
        // and might not be just a field validation issue.
        if (v2Error.type === 'BACKEND') {
          code = 'API_ERROR'; // Or a more specific backend error code if available
          generalMessage = `A backend error occurred: ${errorMessage}`;
          // Check if errorCode from backend error is a status code or can be mapped
          // For now, this is a basic assignment.
        }
      });

      if (fieldErrors.length === 1 && code === 'VALIDATION_ERROR_FIELDS') {
        // If only one field error, make the general message more specific.
        generalMessage = `Validation failed for field '${fieldErrors[0].field}': ${fieldErrors[0].message}`;
      }
    } else if (odinResult && odinResult.message) {
      // Fallback to v1-style error parsing if result.errors is not present
      this.log('DEBUG', '[Core] `result.errors` not found or empty, parsing from `result.message` (OdinPay.js v1 style or unexpected v2).');
      if (typeof odinResult.message === 'string') {
        generalMessage = odinResult.message;
        // Try to extract HTTP status code
        const httpMatch = odinResult.message.match(/Error: HTTP error. Status: (\d+)/);
        if (httpMatch && httpMatch[1]) {
          httpStatusCode = parseInt(httpMatch[1], 10);
          code = httpStatusCode >= 500 ? 'API_SERVER_ERROR' : 'API_CLIENT_ERROR';
          if (httpStatusCode === 401) code = 'API_AUTH_ERROR';
        } else {
          code = 'GENERAL_PAYMENT_ERROR'; // Or ODIN_CALLBACK_ERROR if more appropriate
        }
      } else if (Array.isArray(odinResult.message)) {
        generalMessage = 'Validation errors occurred.'; // More generic
        code = 'VALIDATION_ERROR_GENERAL';
        // We could also populate fieldErrors if we can parse these strings further
        odinResult.message.forEach((msg: string, index: number) => {
          fieldErrors.push({ field: `general[${index}]`, message: msg });
        });
      } else if (typeof odinResult.message === 'object' && odinResult.message !== null) {
        generalMessage = 'Validation failed. Please check the fields below.'; // More generic message
        code = 'VALIDATION_ERROR_FIELDS';
        for (const fieldKey in odinResult.message) {
          if (Object.prototype.hasOwnProperty.call(odinResult.message, fieldKey)) {
            fieldErrors.push({
              field: fieldKey,
              message: odinResult.message[fieldKey] as string,
            });
          }
        }
        if (fieldErrors.length === 1 && fieldErrors[0].field.match(/^\d+$/)) {
          generalMessage = fieldErrors[0].message; // If it's an object with numeric keys like "0"
        }
      }
    }

    const payload: OdinPayErrorPayload = {
      code,
      message: generalMessage,
    };
    if (fieldErrors.length > 0) {
      payload.fieldErrors = fieldErrors;
    }
    if (httpStatusCode) {
      payload.httpStatusCode = httpStatusCode;
    }
    payload.rawError = odinResult.message;

    return payload;
  }

  private getFieldId(fieldName: string): string {
    // Normalize fieldName for use in ID, e.g., 'cardInformation' -> 'card-information'
    const normalizedFieldName = fieldName.replace(/([A-Z])/g, '-$1').toLowerCase();
    return `${this.componentId}-${normalizedFieldName}`;
  }

  private renderBillingField(fieldName: keyof BillingFieldsConfig, isAlwaysRendered: boolean = false) {
    if (!isAlwaysRendered && !this.isFieldEnabled(fieldName)) {
      return null; // Don't render if not enabled and not mandatory structural
    }

    const fieldId = this.getFieldId(fieldName as string); // Cast to string as getFieldId expects generic string
    const label = this.getLabel(fieldName);

    return (
      <div class="odin-field-container" key={fieldName as string}>
        <label htmlFor={fieldId}>{label}</label>
        <div id={fieldId} class="odin-input"></div>
      </div>
    );
  }

  private renderSubmitArea() {
    const isButtonDisabled = this.isLoading || !this.odinFormRenderedBySDK || !!this.initializationError;
    const visibleSubmitButtonId = this.getFieldId('visibleSubmitButton');
    const odinHiddenSubmitButtonId = this.getFieldId('odinSubmitButton');

    return (
      <div class="odin-submit-container">
        <button id={visibleSubmitButtonId} class="odin-submit-button" type="button" disabled={isButtonDisabled} onClick={this.handleVisibleSubmitClick}>
          {this.isLoading ? 'Loading...' : 'Pay'}
        </button>
        <button id={odinHiddenSubmitButtonId} type="button" style={{ display: 'none' }} aria-hidden="true"></button>
        <div class="odin-form-footer">Secured by ODIN Pay</div>
      </div>
    );
  }

  private renderCardFields() {
    // Define the order of fields for rendering
    // Note: cardInformation is handled separately first as it's always present.
    // postalCode is also handled as always present structurally.
    const optionalFieldRenderOrder: OptionalBillingFieldName[] = [
      'name',
      'addressLine1',
      'addressLine2',
      'city',
      'state',
      // 'postalCode' is handled below as it's structurally mandatory
      'country',
      'emailAddress',
      'phoneNumber',
    ];

    return (
      <div>
        {/* Card Information */}
        {this.renderBillingField('cardInformation', true)}

        {/* Dynamically Rendered Billing Fields */}
        {optionalFieldRenderOrder.map(fieldName => this.renderBillingField(fieldName, false))}

        {/* Postal Code - Always rendered structurally */}
        {this.renderBillingField('postalCode', true)}
      </div>
    );
  }

  private renderAchFields() {
    // For bankAccountType, OdinPay.js creates the <select>. We just provide a container.
    // The label for this field should be "Account Type" or similar.
    const bankAccountTypeFieldId = this.getFieldId('bankAccountTypeContainer');

    // Optional billing fields can be shared if the design calls for it.
    // For simplicity, let's assume the same optional fields for now.
    const optionalAchBillingFieldRenderOrder: OptionalBillingFieldName[] = [
      // 'name' for ACH is 'Account Holder Name', handled separately
      'addressLine1',
      'addressLine2',
      'city',
      'state',
      // 'postalCode', // Postal code can be relevant for ACH billing
      'country',
      'emailAddress',
      'phoneNumber',
    ];

    return (
      <div>
        {/* Account Holder Name */}
        <div class="odin-field-container" key="accountHolderName">
          <label htmlFor={this.getFieldId('accountHolderName')}>{this.getLabel('name')}</label>
          <div id={this.getFieldId('accountHolderName')} class="odin-input"></div>
        </div>

        {/* Account Number */}
        <div class="odin-field-container" key="accountNumber">
          <label htmlFor={this.getFieldId('accountNumber')}>{this.getLabel('accountNumber' as any)}</label>
          <div id={this.getFieldId('accountNumber')} class="odin-input"></div>
        </div>

        {/* Bank Account Type */}
        <div class="odin-field-container" key="bankAccountType">
          <label htmlFor={bankAccountTypeFieldId}>{this.getLabel('bankAccountType' as any)}</label>
          <div id={bankAccountTypeFieldId} class="odin-input">
            {' '}
            {/* OdinPay.js will inject a <select> here */}{' '}
          </div>
        </div>

        {/* Country Specific Fields */}
        {this.countryCode === 'US' && (
          <div class="odin-field-container" key="routingNumber">
            <label htmlFor={this.getFieldId('routingNumber')}>{this.getLabel('routingNumber' as any)}</label>
            <div id={this.getFieldId('routingNumber')} class="odin-input"></div>
          </div>
        )}
        {this.countryCode === 'CA' && (
          <span>
            {' '}
            {/* Use span or fragment if it doesn't need a div wrapper */}
            <div class="odin-field-container" key="transitNumber">
              <label htmlFor={this.getFieldId('transitNumber')}>{this.getLabel('transitNumber' as any)}</label>
              <div id={this.getFieldId('transitNumber')} class="odin-input"></div>
            </div>
            <div class="odin-field-container" key="institutionNumber">
              <label htmlFor={this.getFieldId('institutionNumber')}>{this.getLabel('institutionNumber' as any)}</label>
              <div id={this.getFieldId('institutionNumber')} class="odin-input"></div>
            </div>
          </span>
        )}

        {optionalAchBillingFieldRenderOrder.map(fieldName => this.renderBillingField(fieldName, false))}
      </div>
    );
  }

  render() {
    return (
      <div class="exerp-odin-dropin-container">
        {/* Initialization Error Display */}
        {this.initializationError && (
          <div class="odin-error-message-container" role="alert">
            Initialization Error: {this.initializationError}
          </div>
        )}

        {/* Conditional Rendering of Fields */}
        {this.paymentMethodType === 'ACH' ? this.renderAchFields() : this.renderCardFields()}

        {/* Submit Area */}
        {this.renderSubmitArea()}
      </div>
    );
  }
}
