# Feature Backlog for ODIN Drop-in Component

This document lists planned features and enhancements beyond the initial MVP scope.

## 👉 Core Component Enhancements

*   ✅ **Error Handling:** 
    *   **Requirement:** Implement error handling for the core component.
    *   **Details:** Ensure that errors from `OdinPay.js` are mapped correctly to the component's error state.
    *   **Status:** Implemented.

*   ✅ **Country Code (`countryCode`)**
    *   **Requirement:** Support country code configuration CA/US. Passed to `OdinPay()` constructor.
    *   **Details:** Added as a mandatory `'US' | 'CA'` prop to core component and facade initialization.
    *   **Status:** Implemented.

*   ✅ **Optional Billing Field Support (`createCardForm`): Name on Card**
    *   **Requirement:** Allow host applications to configure and render the optional "Name on Card" field.
    *   **Details:**
        *   Added `billingFieldsConfig: { name?: boolean }` prop to core component and facade.
        *   Core component conditionally renders the field container and configures `OdinPay.createCardForm()`.
    *   **Status:** Implemented for `name` field.

*   ✅ **Optional Billing Field Support (`createCardForm`): Address Fields, etc.**
    *   **Requirement:** Allow host applications to configure and render other optional billing fields.
    *   **Details:**
        *   Extended `BillingFieldsConfig` to include `addressLine1`, `addressLine2`, `city`, `state`, `country`, `emailAddress`, `phoneNumber`.
        *   Core Stencil component now renders necessary containers and passes config to `OdinPay.createCardForm()`.
        *   The `billingInformation` object (with a nested `address` object) is returned in the `result.paymentMethod` payload from `OdinPay.js` and propagated to the host application's `onSubmit` callback.
    *   **Status:** Implemented.

*   ✅ **Field Customization (Labels, Placeholders)**
    *   **Requirement:** Allow host applications to customize placeholder text and ARIA labels for configurable fields (e.g., `postalCode`, optional billing fields), and labels for all fields.
    *   **Details:**
        *   Labels for all fields (including `cardInformation`) can be customized via `billingFieldsConfig`.
        *   Placeholders for all fields (except the internal placeholder of `cardInformation`) can be customized via `billingFieldsConfig`.
        *   Facade configuration passes these values down to the core component, which then uses them in its `render()` method for labels and in the `OdinPay.createCardForm()` configuration for placeholders.
        *   *ARIA label customization is pending future implementation if required.*
    *   **Status:** Labels and Placeholders Implemented. ARIA labels pending.

*   ✅ **Return `billingInformation` in `onSubmit` Callback**
    *   **Requirement:** Ensure that billing information collected via enabled fields is returned to the host application.
    *   **Details:** The `onSubmit` callback from the facade now includes an optional `billingInformation` object in its result payload, matching the structure returned by `OdinPay.js`.
    *   **Status:** Implemented

*   👉 **Theme Configuration Pass-through:**
    *   **Requirement:** Allow host applications to pass a theme configuration object via the `@exerp/odin-dropin` facade (`config.theme`).
    *   **Details:** The core Stencil component (`exerp-odin-cc-form`) should accept this theme object as a prop. It should then use this object (merged with defaults) when initializing `OdinPay()` via its `theme` option. This allows host applications to customize the appearance of the input fields rendered by `OdinPay.js`.
        *   *Note: Current implementation hardcodes the theme structure due to a quirk in OdinPay.js options parsing. This task would involve revisiting how the theme is passed if OdinPay.js is updated or a more robust workaround is found.*
    *   **Status:** Deferred from MVP. Low priority. (Added note about current status)

*   ✅ **Configurable Logging Level**
    *   **Requirement:** Add a mechanism to control the verbosity of console logging.
    *   **Details:** Implemented an optional `logLevel` parameter ('NONE', 'ERROR', 'WARN', 'INFO', 'DEBUG', default: 'WARN') for the `OdinDropin` facade constructor. This level is respected by both the facade and the core component to filter console messages. Demo app updated with UI to select the level.
    *   **Status:** Implemented.

## ✅ Demo Application Enhancements

*   ✅ **Initial Setup (`apps/demo`)**:
    *   **Requirement:** Create a basic Vue 3 + TS demo app using Vite.
    *   **Details:** Allows local testing and serves as an example. Consumes `@exerp/odin-dropin` via workspace linking. Includes basic UI for token input, mounting, and result display.
    *   **Status:** Implemented.

*   ✅ **Country Code Selection**:
    *   **Requirement:** Add UI in the demo app to select the `countryCode`.
    *   **Details:** Added a dropdown for 'US'/'CA'.
    *   **Status:** Implemented.

*   ✅ **`isSingleUse` Toggle**
    *   **Requirement:** Add a UI toggle in the demo application to control the `isSingleUse` flag passed to the `OdinDropin`.
    *   **Details:** Will allow easier testing of both single-use and potentially saveable payment method token generation flows.
    *   **Status:** Implemented.

*   ✅ **Configuration Section UI Refactor**
    *   **Requirement:** Improve the layout and organization of the configuration options in the demo app UI (`App.vue`).
    *   **Details:** As more options (country code, billing fields toggles, isSingleUse toggle, etc.) are added, the current single-column layout might become cluttered. Refactor needed for better usability during development and testing. Could involve grouping related options.
    *   **Status:** Implemented.

## ✅ ACH Support 

*   ✅ **Implement ACH Support**
    *   **Requirement:** Implement support for capturing Bank Account (ACH) details.
    *   **Details:**
        *   Extended core component (`exerp-odin-cc-form`) and facade (`OdinDropin`) to handle `paymentMethodType: 'ACH'`.
        *   Core component now calls `OdinPay.createBankAccountForm()` with appropriate field configurations based on `countryCode` (US vs. CA for routing/transit/institution numbers).
        *   Supported fields: Account Holder Name, Account Number, Bank Account Type (Checking/Savings via OdinPay.js-generated `<select>`).
        *   Optional billing fields are also supported alongside ACH details.
        *   `OdinSubmitPayload` in `onSubmit` callback now includes `paymentMethodType: 'BANK_ACCOUNT'` and `AchPaymentMethodDetails` (account type, last4, bank numbers, country).
        *   Error handling and field customization (labels/placeholders) extended for ACH fields.
    *   **Status:** Implemented.
    *   **Follow-up/Notes:**
        *   `isSingleUse` flag usage for ACH tokens via `createBankAccountForm` is unconfirmed by OdinPay.js documentation/behavior; currently omitted from the call. Monitor if this impacts token usability.

## 👉 Testing Strategy & Implementation

*   **Requirement:** Implement a comprehensive testing suite to ensure component reliability and prevent regressions.
*   **Details:**
    *   **Core Component Unit Tests (`.spec.ts`):**
        *   Use Stencil's testing utilities (`@stencil/core/testing`).
        *   Verify component rendering with different props (`odinPublicToken`, `isSingleUse`).
        *   Verify the presence of required DOM elements (containers, buttons).
        *   Potentially mock internal methods (`initializeOdinPayAndForm`) to check if they are called appropriately based on props/lifecycle.
        *   Verify events are correctly declared and can be emitted (mocking the emit call might be necessary).
    *   **Facade Unit Tests (`.spec.ts` / `.test.ts`):**
        *   Add a test runner (e.g., Vitest) to the `packages/odin-dropin` package.
        *   Test the `OdinDropin` class logic (constructor, parameter handling, defaults).
        *   Mock DOM interactions (`document.createElement`, `appendChild`, `removeChild`) and the core component instance.
        *   Verify `mount()` sets props and attaches listeners correctly.
        *   Verify `unmount()` removes the element and listeners.
        *   Verify facade event handlers correctly call the provided `onSubmit`/`onError` callbacks.
    *   **Core Component E2E Tests (`.e2e.ts`):**
        *   Use Stencil's E2E testing (Puppeteer).
        *   Verify basic rendering in a browser context.
        *   Test prop updates reflect in the DOM where applicable (e.g., if we added displayed text based on props).
        *   *(Note: Full end-to-end testing involving OdinPay.js iframe interaction might be complex/brittle and lower priority).*
*   **Status:** Pending implementation.

## Other

*   [Add other potential features or improvements here]