# Feature Backlog for ODIN Drop-in Component

This document lists planned features and enhancements beyond the initial MVP scope.

## Core Component Enhancements

*   **Theme Configuration Pass-through:**
    *   **Requirement:** Allow host applications to pass a theme configuration object via the `@exerp/odin-dropin` facade (`config.theme`).
    *   **Details:** The core Stencil component (`exerp-odin-cc-form`) should accept this theme object as a prop. It should then use this object (merged with defaults) when initializing `OdinPay()` via its `theme` option. This allows host applications to customize the appearance of the input fields rendered by `OdinPay.js`.
    *   **Status:** Deferred from MVP.

*   **Optional Billing Field Support (`createCardForm`):**
    *   **Requirement:** Allow host applications to configure and render optional billing fields alongside the core Card Information and Postal Code fields.
    *   **Details:**
        *   Start with the `name` field (Name on Card).
        *   Potentially extend to `addressLine1`, `addressLine2`, `city`, `state`, `country`, `emailAddress`, `phoneNumber`.
        *   The facade's initialization options should accept configuration for which fields to include (e.g., `fields: { name: true, address: false }`).
        *   The core Stencil component needs to render the necessary container `div`s and pass the configuration (selectors, placeholders, etc.) to `OdinPay.createCardForm()`.
        *   Billing information collected should be included in the `paymentMethod.billingInformation` object within the `onSubmit` callback payload.
    *   **Status:** Pending design/implementation.

*   **Field Customization (`placeholder`, `ariaLabel`):**
    *   **Requirement:** Allow host applications to customize placeholder text and ARIA labels for configurable fields (e.g., `postalCode`, optional billing fields).
    *   **Details:** Extend facade configuration and pass values down as props to the core component, which then uses them in the `OdinPay.createCardForm()` configuration.
    *   **Status:** Pending design/implementation.

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

## Other

*   [Add other potential features or improvements here]