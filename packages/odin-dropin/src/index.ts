import "@exerp/odin-dropin-core/exerp-odin-cc-form";
import { OdinPaySubmitPayload } from "../../core/dist/types/components";

import type {
  OdinPayErrorPayload as CoreOdinPayErrorPayload,
  OdinPaySubmitPayload as CoreOdinPaySubmitPayload,
  BillingFieldsConfig as CoreBillingFieldsConfig,
  OdinPayBillingInformation as CoreOdinPayBillingInformation,
  FieldCustomization as CoreFieldCustomization,
  CardPaymentMethodDetails as CoreCardPaymentMethodDetails,
  AchPaymentMethodDetails as CoreAchPaymentMethodDetails,
  PaymentMethodSpecificDetails as CorePaymentMethodSpecificDetails,
  OdinPayFieldError,
} from "../../core/dist/types/components/exerp-odin-cc-form/exerp-odin-cc-form";

import {
  log,
  isLogLevelEnabled,
  LogLevel,
  DEFAULT_LOG_LEVEL,
} from "./utils/logger";

/**
 * Payload for the `onChangeValidation` callback, mirroring OdinPay.js v2's `fieldInformation` object.
 */
export interface OdinFieldValidationEvent {
  /** The type of event, typically "FIELD_VALIDATION". */
  type: string;
  /** The name of the field being validated (e.g., "cardNumber", "postalCode"). */
  fieldName: string;
  /** The CSS selector for the field's container. */
  selector: string;
  /** Indicates if the field is currently valid. */
  isValid: boolean;
  /** An error code if the field is invalid (e.g., "INVALID", "REQUIRED", "MAX_LENGTH_EXCEEDED"). */
  errorCode?: string;
}

/**
 * Represents a set of CSS-like style properties for OdinPay.js v2 theme.
 * Allows for standard CSS properties and pseudo-selector keys.
 */
export interface OdinV2ThemeStyleObject {
  [key: string]:
    | string
    | number
    | { [pseudoSelector: string]: string | number }; // Basic style or nested pseudo-selector styles
  // Example properties (non-exhaustive, refer to OdinPay.js v2 docs for allowed props):
  // color?: string;
  // fontFamily?: string;
  // fontSize?: string;
  // padding?: string;
  // backgroundColor?: string;
  // textDecoration?: string;
  // '::placeholder'?: { color?: string; /* ... other placeholder styles ... */ };
  // ':hover'?: { backgroundColor?: string; /* ... other hover styles ... */ };
  // ':focus'?: { /* ... focus styles ... */ };
}

/**
 * Configuration object for the OdinPay.js v2 theme.
 * This is a flat object where keys are CSS properties or pseudo-selectors.
 */
export type OdinV2ThemeConfig = OdinV2ThemeStyleObject;

interface OdinDropinInitializationParams {
  odinPublicToken: string;
  countryCode: "US" | "CA";
  paymentMethodType?: "CARD" | "BANK_ACCOUNT";
  /**
   * Optional configuration to enable and customize billing fields.
   * Fields can be enabled with `true` (using default label/placeholder)
   * or with a `FieldCustomization` object ({ label?: string; placeholder?: string; }).
   * Example: { name: true, addressLine1: { label: 'Street Address' } }
   * postalCode/cardInformation can only receive customization.
   */
  billingFieldsConfig?: CoreBillingFieldsConfig; //
  onSubmit: (result: CoreOdinPaySubmitPayload) => void;
  onError: (error: CoreOdinPayErrorPayload) => void;
  logLevel?: LogLevel;
  /**
   * Optional callback function invoked by OdinPay.js v2 during user interaction
   * with input fields, providing real-time validation status for individual fields.
   *
   * @param event - An `OdinFieldValidationEvent` object containing details about the validated field.
   * @since 2.0.0
   */
  onChangeValidation?: (event: OdinFieldValidationEvent) => void;
  /**
   * Optional theme configuration object for OdinPay.js v2.
   * This object should follow the flat structure specified by OdinPay.js v2,
   * allowing CSS properties and pseudo-selectors.
   * Border styling is NOT part of this theme and must be applied via external CSS
   * to the field container divs.
   * @since 2.0.0
   */
  theme?: OdinV2ThemeConfig;
}

export class OdinDropin {
  private params: OdinDropinInitializationParams;
  private odinCcFormComponent: HTMLExerpOdinCcFormElement | null = null;
  private eventListenersAttached: boolean = false;
  private currentLogLevel: LogLevel;
  private onChangeValidationCallback?: (
    event: OdinFieldValidationEvent
  ) => void;
  private themeConfig?: OdinV2ThemeConfig;

  constructor(params: OdinDropinInitializationParams) {
    this.params = params;
    this.currentLogLevel = params.logLevel ?? DEFAULT_LOG_LEVEL;
    this.onChangeValidationCallback = params.onChangeValidation;
    this.themeConfig = params.theme;

    log(this.currentLogLevel, "INFO", "OdinDropin instance created.", {
      // Log object for easier viewing
      logLevel: this.currentLogLevel,
      countryCode: params.countryCode,
      billingFieldsConfigProvided: !!params.billingFieldsConfig,
      onChangeValidationProvided: !!params.onChangeValidation,
      themeProvided: !!params.theme,
    });

    // The custom element <exerp-odin-cc-form> should already be defined by the import at the top.
  }

  // Mount method is now synchronous as no loader setup is needed here
  public mount(selectorOrElement: string | HTMLElement): void {
    let mountPoint: HTMLElement | null;

    if (typeof selectorOrElement === "string") {
      mountPoint = document.querySelector(selectorOrElement);
    } else {
      mountPoint = selectorOrElement;
    }

    if (!mountPoint) {
      log(
        this.currentLogLevel,
        "ERROR",
        `OdinDropin: Mount point '${selectorOrElement}' not found.`
      );
      this.params.onError({
        code: "MOUNT_POINT_NOT_FOUND",
        message: `Mount point '${selectorOrElement}' not found.`,
      });
      return;
    }

    if (!this.params.countryCode) {
      const errorMsg =
        "OdinDropin: 'countryCode' is missing in initialization parameters.";
      log(this.currentLogLevel, "ERROR", errorMsg);
      this.params.onError({
        code: "INIT_NO_COUNTRY_CODE_FACADE",
        message: errorMsg,
      });
      return;
    }

    mountPoint.innerHTML = ""; // Clear previous content
    this.odinCcFormComponent = document.createElement(
      "exerp-odin-cc-form"
    ) as HTMLExerpOdinCcFormElement;
    if (this.odinCcFormComponent) {
      this.odinCcFormComponent.paymentMethodType =
        this.params.paymentMethodType ?? "CARD";
      if (this.params.paymentMethodType) {
        // Ensure the type matches the allowed prop types "CARD" | "BANK_ACCOUNT"
        this.odinCcFormComponent.paymentMethodType =
          this.params.paymentMethodType;
      }
      log(this.currentLogLevel, "DEBUG", "[Facade] Setting component props:", {
        tokenProvided: this.params.odinPublicToken, // Display the public token because I need to when debugging
        paymentMethodType: this.odinCcFormComponent.paymentMethodType, // Log the payment method type
        countryCode: this.params.countryCode,
        logLevel: this.currentLogLevel, // Log the level being passed
        billingFieldsConfig: this.params.billingFieldsConfig, // Log the config object (can be verbose)
      });
      this.odinCcFormComponent.odinPublicToken = this.params.odinPublicToken;
      this.odinCcFormComponent.countryCode = this.params.countryCode;
      this.odinCcFormComponent.logLevel = this.currentLogLevel;

      if (this.params.billingFieldsConfig) {
        this.odinCcFormComponent.billingFieldsConfig =
          this.params.billingFieldsConfig;
      }

      if (this.onChangeValidationCallback) {
        // this.onChangeValidationCallback is from constructor
        this.odinCcFormComponent.onChangeValidation =
          this.onChangeValidationCallback;
        log(
          this.currentLogLevel,
          "DEBUG",
          "[Facade] Passed onChangeValidation callback to core component's prop."
        );
      } else {
        log(
          this.currentLogLevel,
          "DEBUG",
          "[Facade] No onChangeValidation callback provided by user; core component prop will be undefined."
        );
      }

      if (this.themeConfig) {
        // We'll name the prop on the core component `themeConfigProp` to avoid conflicts
        // with any internal 'theme' properties if Stencil had them.
        (this.odinCcFormComponent as any).themeConfigProp = this.themeConfig;
        log(
          this.currentLogLevel,
          "DEBUG",
          "[Facade] Passed themeConfig to core component prop:",
          JSON.stringify(this.themeConfig)
        );
      } else {
        log(
          this.currentLogLevel,
          "DEBUG",
          "[Facade] No themeConfig provided by user for core component."
        );
      }

      log(
        this.currentLogLevel,
        "DEBUG",
        "[Facade] Component instance props set. Token:",
        this.odinCcFormComponent.odinPublicToken,
        "Country:",
        this.odinCcFormComponent.countryCode,
        "Payment Method Type:",
        this.odinCcFormComponent.paymentMethodType,
        "Billing Config:",
        JSON.stringify(this.odinCcFormComponent.billingFieldsConfig),
        "Payment Method Type:",
        this.odinCcFormComponent.paymentMethodType
      );

      this.odinCcFormComponent.addEventListener(
        "odinSubmitInternal",
        this.handleOdinSubmit
      );
      this.odinCcFormComponent.addEventListener(
        "odinErrorInternal",
        this.handleOdinError
      );
      this.eventListenersAttached = true;

      mountPoint.appendChild(this.odinCcFormComponent);
      log(
        this.currentLogLevel,
        "INFO",
        "exerp-odin-cc-form mounted to",
        mountPoint,
        "with paymentMethodType:",
        this.odinCcFormComponent.paymentMethodType
      );
    } else {
      log(
        this.currentLogLevel,
        "ERROR",
        "Failed to create exerp-odin-cc-form component instance."
      );
      this.params.onError({
        code: "COMPONENT_CREATION_FAILED",
        message: "Failed to create Stencil component instance.",
      });
    }
  }

  private handleOdinSubmit = (event: CustomEvent<OdinPaySubmitPayload>) => {
    log(this.currentLogLevel, "INFO", "[Facade] handleOdinSubmit TRIGGERED.");
    if (isLogLevelEnabled(this.currentLogLevel, "DEBUG")) {
      log(
        this.currentLogLevel,
        "DEBUG",
        "[Facade] Submit Event Detail:",
        event.detail
      );
    }
    this.params.onSubmit(event.detail); // Call the host app's callback
  };

  private handleOdinError = (event: CustomEvent<CoreOdinPayErrorPayload>) => {
    log(this.currentLogLevel, "ERROR", "[Facade] handleOdinError TRIGGERED.");
    if (isLogLevelEnabled(this.currentLogLevel, "WARN")) {
      log(
        this.currentLogLevel,
        "WARN",
        "[Facade] Error Event Detail:",
        event.detail
      );
    }
    this.params.onError(event.detail); // Call the host app's callback
  };

  public unmount(): void {
    if (this.odinCcFormComponent) {
      if (this.eventListenersAttached) {
        this.odinCcFormComponent.removeEventListener(
          "odinSubmitInternal",
          this.handleOdinSubmit
        );
        this.odinCcFormComponent.removeEventListener(
          "odinErrorInternal",
          this.handleOdinError
        );
        this.eventListenersAttached = false;
      }
      // --- END ADD ---
      if (this.odinCcFormComponent.parentNode) {
        this.odinCcFormComponent.parentNode.removeChild(
          this.odinCcFormComponent
        );
      }
      this.odinCcFormComponent = null;
      log(this.currentLogLevel, "INFO", "exerp-odin-cc-form unmounted.");
    }
  }
}

// TODO: For UMD/global variable builds, Vite will use the 'name' option in build.lib
// This allows for `new OdinDropin(...)` if the script is included directly.
// No explicit window.OdinDropin = OdinDropin needed here if Vite is configured.
// Keep the test function if you still use it for basic link verification, or remove it.
export function initializeOdinDropin(): string {
  console.log("initializeOdinDropin CALLED (legacy test function)");
  return "Odin Drop-in Initialized (Test)";
}

export type {
  CoreOdinPayErrorPayload as OdinPayErrorPayload,
  CoreBillingFieldsConfig as BillingFieldsConfig,
  CoreOdinPayBillingInformation as OdinPayBillingInformation,
  CoreFieldCustomization as FieldCustomization,
  // Export the core submit payload type directly or create a facade-specific one if needed
  CoreOdinPaySubmitPayload as OdinSubmitPayload,
  CoreCardPaymentMethodDetails as CardPaymentMethodDetails,
  CoreAchPaymentMethodDetails as AchPaymentMethodDetails,
  CorePaymentMethodSpecificDetails as PaymentMethodSpecificDetails,
  LogLevel,
};
