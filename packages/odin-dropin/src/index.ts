import "@exerp/odin-dropin-core/exerp-odin-cc-form";
import {
  OdinPayErrorPayload as CoreOdinPayErrorPayload, // Use an alias to avoid name clash if needed locally
  OdinPaySubmitPayload,
  BillingFieldsConfig as CoreBillingFieldsConfig,
} from "../../core/dist/types/components";

// This is for general drop-in config, not specific OdinPay fields yet
interface OdinDropinConfigOptions {
  theme?: { primaryColor?: string; fontBase?: string };
  // 📝 Future: we might move billingFieldsConfig under this 'config' object if it makes sense.
  // For now, keeping it at the top level of OdinDropinInitializationParams.
}

interface OdinSubmitPayload {
  paymentMethodId: string;
  // other relevant state?
}

interface OdinDropinInitializationParams {
  odinPublicToken: string;
  countryCode: "US" | "CA";
  isSingleUse?: boolean;
  /**
   * Optional configuration to enable and manage additional billing fields.
   * Example: { name: true } to enable the "Name on Card" field.
   */
  billingFieldsConfig?: CoreBillingFieldsConfig;
  config?: OdinDropinConfigOptions;
  onSubmit: (result: OdinSubmitPayload) => void;
  onError: (error: CoreOdinPayErrorPayload) => void;
}

export class OdinDropin {
  private params: OdinDropinInitializationParams;
  private odinCcFormComponent: HTMLExerpOdinCcFormElement | null = null;
  private eventListenersAttached: boolean = false;

  constructor(params: OdinDropinInitializationParams) {
    this.params = params;
    console.log(
      "OdinDropin instance created. Public token:",
      params.odinPublicToken,
      "Country Code:",
      params.countryCode,
      "Billing Fields Config:",
      params.billingFieldsConfig
    );
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
      console.error(
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
      console.error(errorMsg);
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
      console.log(
        "[Facade] Token to pass to component:",
        this.params.odinPublicToken,
        "Country Code to pass:",
        this.params.countryCode,
        "Billing Fields Config:",
        this.params.billingFieldsConfig
      );
      this.odinCcFormComponent.odinPublicToken = this.params.odinPublicToken;
      this.odinCcFormComponent.countryCode = this.params.countryCode;

      // Pass isSingleUse (handle undefined by defaulting as the component does)
      if (typeof this.params.isSingleUse === "boolean") {
        this.odinCcFormComponent.isSingleUse = this.params.isSingleUse;
      }

      if (this.params.billingFieldsConfig) {
        this.odinCcFormComponent.billingFieldsConfig = this.params.billingFieldsConfig;
      }

      console.log(
        "[Facade] Component instance after setting props:",
        this.odinCcFormComponent,
        "token:",
        this.odinCcFormComponent.odinPublicToken,
        "countryCode:",
        this.odinCcFormComponent.countryCode,
        "billingFieldsConfig:", this.odinCcFormComponent.billingFieldsConfig
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
      console.log(
        "exerp-odin-cc-form mounted to", mountPoint,
        "with token, countryCode, isSingleUse, and billingFields config."
      );
    } else {
      console.error("Failed to create exerp-odin-cc-form component instance.");
      this.params.onError({
        code: "COMPONENT_CREATION_FAILED",
        message: "Failed to create Stencil component instance.",
      });
    }
  }

  private handleOdinSubmit = (event: CustomEvent<OdinPaySubmitPayload>) => {
    console.log(
      "[Facade] handleOdinSubmit TRIGGERED. Event detail:",
      event.detail
    ); // Log to confirm it's hit
    this.params.onSubmit(event.detail); // Call the host app's callback
  };

  private handleOdinError = (event: CustomEvent<CoreOdinPayErrorPayload>) => {
    console.log(
      "[Facade] handleOdinError TRIGGERED. Event detail:",
      event.detail
    ); // Log to confirm it's hit
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
      console.log("exerp-odin-cc-form unmounted.");
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

export type { CoreOdinPayErrorPayload as OdinPayErrorPayload };
export type { CoreBillingFieldsConfig as BillingFieldsConfig };
