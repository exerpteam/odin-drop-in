# Feature Backlog for ODIN Drop-in Component

This document lists planned features and enhancements beyond the initial MVP scope.

## Core Component Enhancements

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

*   **Optional Billing Field Support (`createCardForm`): Address Fields, etc.**
    *   **Requirement:** Allow host applications to configure and render other optional billing fields.
    *   **Details:**
        *   Extend `BillingFieldsConfig` to include `addressLine1`, `addressLine2`, `city`, `state`, `emailAddress`, `phoneNumber`.
        *   Core Stencil component needs to render necessary containers and pass config to `OdinPay.createCardForm()`.
        *   Billing information collected should be included in the `paymentMethod.billingInformation` object within the `onSubmit` callback payload (verify with OdinPay.js).
    *   **Status:** Pending design/implementation for additional fields.

*   **Field Customization (`placeholder`, `ariaLabel`):**
    *   **Requirement:** Allow host applications to customize placeholder text and ARIA labels for configurable fields (e.g., `postalCode`, optional billing fields).
    *   **Details:** Extend facade configuration and pass values down as props to the core component, which then uses them in the `OdinPay.createCardForm()` configuration.
    *   **Status:** Pending design/implementation.

*   **Theme Configuration Pass-through:**
    *   **Requirement:** Allow host applications to pass a theme configuration object via the `@exerp/odin-dropin` facade (`config.theme`).
    *   **Details:** The core Stencil component (`exerp-odin-cc-form`) should accept this theme object as a prop. It should then use this object (merged with defaults) when initializing `OdinPay()` via its `theme` option. This allows host applications to customize the appearance of the input fields rendered by `OdinPay.js`.
        *   *Note: Current implementation hardcodes the theme structure due to a quirk in OdinPay.js options parsing. This task would involve revisiting how the theme is passed if OdinPay.js is updated or a more robust workaround is found.*
    *   **Status:** Deferred from MVP. Low priority. (Added note about current status)

*  **Console Logging:**
    *   **Requirement:** Add log level to the core component.
    *   **Details:** Implement a log level configuration option to control the verbosity of console logs. This should be passed to `OdinPay.js` and used to filter logs accordingly.
    *   **Status:** Pending design/implementation.

*   **Demo App: `isSingleUse` Toggle**
    *   **Requirement:** Add a UI toggle in the demo application to control the `isSingleUse` flag passed to the `OdinDropin`.
    *   **Details:** Will allow easier testing of both single-use and potentially saveable payment method token generation flows.
    *   **Status:** Pending implementation.

## ACH Support

*   **Requirement:** Implement support for capturing Bank Account (ACH) details.
*   **Details:**
    *   Add a method like `createBankAccountForm` to the facade and core component.
    *   Handle country-specific fields (US vs. CA).
    *   Expose `country` configuration via the facade.
    *   Implement necessary UI and `OdinPay.createBankAccountForm()` integration.
*   **Status:** Pending design/implementation.

## Payment Agreement Features

*   **Requirement:** Support flows for creating and managing payment agreements (Card-on-File / Recurring).
*   **Details:**
    *   Handle `$0` authorization (or workarounds like small auth + void) for creating agreements without initial payment (requires coordination with ODIN API capabilities).
    *   Ensure `isSingleUse: false` is correctly utilized.
    *   Support "update/replace" flows.
*   **Status:** Pending design/implementation (blocked by $0 auth clarification).

## Testing Strategy & Implementation

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