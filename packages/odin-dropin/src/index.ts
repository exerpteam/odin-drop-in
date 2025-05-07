import '@exerp/odin-dropin-core/exerp-odin-cc-form';
import type { ExerpOdinCcForm } from '@exerp/odin-dropin-core/exerp-odin-cc-form';

// 🧑‍💻 Define interfaces for the configuration and callbacks based on the MVP spec
interface OdinDropinConfigOptions {
  theme?: { primaryColor?: string; fontBase?: string };
  // Add other config properties as needed
}

interface OdinSubmitPayload {
  paymentMethodId: string;
  // other relevant state?
}

interface OdinErrorPayload {
  code: string;
  message?: string;
  field?: string;
  // other potential OdinPay error fields
}

interface OdinDropinInitializationParams {
  odinPublicToken: string;
  isSingleUse?: boolean;
  config?: OdinDropinConfigOptions;
  onSubmit: (result: OdinSubmitPayload) => void;
  onError: (error: OdinErrorPayload) => void;
}

export class OdinDropin {
  private params: OdinDropinInitializationParams;
  private odinCcFormComponent: ExerpOdinCcForm | null = null;

  constructor(params: OdinDropinInitializationParams) {
    this.params = params;
    console.log('OdinDropin instance created (using direct custom element import). Public token:', params.odinPublicToken);
    // The custom element <exerp-odin-cc-form> should already be defined by the import at the top.
  }

  // Mount method is now synchronous as no loader setup is needed here
  public mount(selectorOrElement: string | HTMLElement): void {
    let mountPoint: HTMLElement | null;

    if (typeof selectorOrElement === 'string') {
      mountPoint = document.querySelector(selectorOrElement);
    } else {
      mountPoint = selectorOrElement;
    }

    if (!mountPoint) {
      console.error(`OdinDropin: Mount point '${selectorOrElement}' not found.`);
      this.params.onError({ code: 'MOUNT_POINT_NOT_FOUND', message: `Mount point '${selectorOrElement}' not found.` });
      return;
    }

    mountPoint.innerHTML = ''; // Clear previous content
    this.odinCcFormComponent = document.createElement('exerp-odin-cc-form');

    // 📝 TODO: Pass props to this.odinCcFormComponent (e.g., publicToken, callbacks for OdinPay.js)
    //    This will be the next step after we confirm rendering.
    //    Example:
    //    (this.odinCcFormComponent as any).publicToken = this.params.odinPublicToken;
    //    (this.odinCcFormComponent as any).onSubmitOdinPay = this.params.onSubmit; // Stencil component would emit, or facade calls it
    //    (this.odinCcFormComponent as any).onErrorOdinPay = this.params.onError;

    // 📝 TODO: Listen to events from this.odinCcFormComponent if it emits 'odinSubmit' / 'odinError'
    //    this.odinCcFormComponent.addEventListener('odinSubmitInternal', (event: CustomEvent<OdinSubmitPayload>) => {
    //      this.params.onSubmit(event.detail);
    //    });
    //    this.odinCcFormComponent.addEventListener('odinErrorInternal', (event: CustomEvent<OdinErrorPayload>) => {
    //      this.params.onError(event.detail);
    //    });


    mountPoint.appendChild(this.odinCcFormComponent);
    console.log('exerp-odin-cc-form mounted directly to', mountPoint);
  }

  public unmount(): void {
    if (this.odinCcFormComponent && this.odinCcFormComponent.parentNode) {
      this.odinCcFormComponent.parentNode.removeChild(this.odinCcFormComponent);
      this.odinCcFormComponent = null;
      console.log('exerp-odin-cc-form unmounted.'); // 🧑‍💻 Log for debugging
    }
  }
}

// 🧑‍💻 For UMD/global variable builds, Vite will use the 'name' option in build.lib
// This allows for `new OdinDropin(...)` if the script is included directly.
// No explicit window.OdinDropin = OdinDropin needed here if Vite is configured.

// 🧑‍💻 Keep the test function if you still use it for basic link verification, or remove it.
export function initializeOdinDropin(): string {
    console.log('initializeOdinDropin CALLED (legacy test function)');
    return 'Odin Drop-in Initialized (Test)';
}