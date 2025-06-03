# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.2] - 2025-05-04

### Changed
-   The internal `@exerp/odin-dropin-core` component now integrates OdinPay.js v2 by importing it from the `@clubessentialholdings/js-elements` NPM package, replacing the previous CDN-based script loading. This enhances version control and build consistency.

## [2.0.1] - 2025-05-20

### Fixed

-   Ensured that when OdinPay.js v2 tokenizes a debit card (returning `type: "DEBIT_CARD"`), the `@exerp/odin-dropin` component correctly processes it as a successful card payment. The `OdinSubmitPayload` emitted to the host application will have `paymentMethodType: 'CARD'` and include all relevant card details, preventing a previous "Unknown payment method type" error for this scenario.

## [2.0.0] - 2025-05-19

This is a major release introducing compatibility with OdinPay.js v2 (JS Elements) and includes significant new features and breaking changes.

### Added

-   **OdinPay.js v2 Compatibility:** Full support for integrating with OdinPay.js v2 (JS Elements), including its new APIs and behaviors.
-   **Real-time Field Validation (`onChangeValidation`):** Introduced a new optional `onChangeValidation` callback parameter in `OdinDropinInitializationParams`. This callback receives real-time, field-level validation events (payload type: `OdinFieldValidationEvent`) directly from OdinPay.js v2 as users interact with input fields.
-   **New Theming Mechanism (`theme`):** Added a new `theme` parameter (`OdinV2ThemeConfig`) to `OdinDropinInitializationParams` for customizing the internal appearance of OdinPay.js v2 input fields. This uses OdinPay.js v2's new flat theme object structure, supporting CSS properties and pseudo-selectors like `::placeholder`, `:hover`, and `:focus`.

### Changed

-   **BREAKING CHANGE (OdinPay.js Dependency):** This version is designed exclusively for OdinPay.js v2. It is not compatible with OdinPay.js v1.x.
-   **BREAKING CHANGE (`isSingleUse` Removed):** The `isSingleUse` parameter has been removed from `OdinDropinInitializationParams`. This feature is deprecated in OdinPay.js v2, where all payment method tokens are inherently multi-use by default.
-   **BREAKING CHANGE (`paymentMethodType` Value):** The `paymentMethodType` parameter in `OdinDropinInitializationParams` (and the corresponding value in `OdinSubmitPayload`) now accepts `'BANK_ACCOUNT'` instead of `'ACH'` for bank account payments. This aligns with OdinPay.js v2 terminology.
    *   Migration: Update `paymentMethodType: 'ACH'` to `paymentMethodType: 'BANK_ACCOUNT'` in your integration.
-   **BREAKING CHANGE (Error Handling - `OdinPayErrorPayload`):** The structure and source of error information in the `OdinPayErrorPayload` (received by the `onError` callback) have been updated for OdinPay.js v2.
    *   For submission errors, details are now primarily derived from OdinPay.js v2's `result.errors` array.
    *   The `fieldErrors` array within `OdinPayErrorPayload` now contains items where the `message` property typically holds the direct `errorCode` string from OdinPay.js v2 (e.g., `"REQUIRED"`, `"INVALID_CARD_INFORMATION"`).
    *   Refer to the updated documentation for the `OdinPayErrorPayload` structure and common error codes.
-   **BREAKING CHANGE (Theming Approach):** Theming has been completely changed to align with OdinPay.js v2.
    *   Internal styling of OdinPay.js input fields (fonts, text colors, input backgrounds, placeholders, interaction states like hover/focus) is now controlled exclusively via the new `theme` prop, which accepts a flat theme object (`OdinV2ThemeConfig`).
    *   **Structural styling such as borders, box-shadows, overall dimensions of field containers, and external backgrounds MUST now be applied via external CSS** by targeting the `div` elements rendered by the `@exerp/odin-dropin` component (e.g., `.odin-field-container`, `.odin-input`). The `theme` object no longer affects these aspects.
-   **Success Payload (`OdinSubmitPayload`):** Updated to ensure accurate mapping of Card and Bank Account details from the OdinPay.js v2 `paymentMethod` object.

### Fixed

-   Resolved a DOM timing issue in the core component that could cause an `appendChild` error during Bank Account form creation.
-   Ensured the `onChangeValidation` callback (which is mandatory for OdinPay.js v2 internally) is always provided by the core component to OdinPay.js, preventing potential console errors from the OdinPay.js library.

### Important Notes for Migration from v1.x.x

-   **Review Breaking Changes:** Carefully review all items marked as "BREAKING CHANGE" above.
-   **Update Initialization Parameters:**
    -   Remove the `isSingleUse` parameter.
    -   If using bank account payments, change `paymentMethodType: 'ACH'` to `paymentMethodType: 'BANK_ACCOUNT'`.
-   **Adapt Theming:**
    -   Utilize the new `theme` prop with an OdinPay.js v2 compatible flat theme object for styling field internals.
    -   Implement external CSS to style field containers (borders, radii, background, etc.), as this is no longer controlled by the theme object. Refer to the documentation for examples.
-   **Update Error Handling:** Adjust your `onError` callback logic to work with the updated `OdinPayErrorPayload` structure, particularly how `fieldErrors` are reported for v2.
-   **OdinPay.js v2 CDN URL:** Please note that this version of `@exerp/odin-dropin` (`v2.0.0`) currently loads OdinPay.js v2 from its development CDN URL (`https://js.odin-dev.com`). A subsequent release will target the official production CDN URL for OdinPay.js v2 or transition to an NPM package dependency when available and stable.

## [1.0.2] - 2025-05-17

### Fixed
- Pinned OdinPay.js dependency to specific version `1.0.6` (`https://js.odinpay.net/1.0.6/index.js`) for users of `@exerp/odin-dropin` v1.x.x. This prevents the component from inadvertently loading the upcoming OdinPay.js v2.0.0 from the default CDN URL (`https://js.odinpay.net`), which would introduce breaking changes.

## [1.0.1] - 2025-05-16
 
### Fixed
- Minor documentation updates.


## [1.0.0] - 2025-05-15

### Added
- Initial release of the `@exerp/odin-dropin` facade library, providing a simplified interface for integrating the OdinPay.js Drop-in component into web applications.

### Important Notes

- OdinPay.js is loaded from the CDN URL `https://js.odinpay.net` (latest version). Currently, this is `1.0.6`, but it may change in the future.