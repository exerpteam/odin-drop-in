# ODIN Drop-in Component - System Overview

## 1. Introduction

The ODIN Payment Drop-in is a reusable JavaScript component library designed to simplify the secure capture of payment details within host web applications. Its primary goal is to provide a streamlined and secure way for integrators to embed ODIN Payments functionality, abstracting the direct complexities of ODIN's `OdinPay.js` library.

This component allows Clubessential's partners to embed a UI that handles the collection of sensitive payment information (such as Credit Card and Bank Account details) directly from the user, tokenizing these details via ODIN for subsequent backend processing.

This document provides a high-level overview of the current system architecture, its main components, and key design principles.

## 2. Core Architectural Principles

The ODIN Drop-in component is built upon the following core architectural principles:

*   **Framework-Agnosticism:** The core UI is built using standard Web Components (via Stencil.js), ensuring compatibility across various frontend frameworks (Vue, React, Angular, plain JavaScript, etc.) or no framework at all.
*   **Simplified Integration (Facade Pattern):** A dedicated facade package (`@exerp/odin-dropin`) provides a clean, high-level API (`OdinDropin` class) that simplifies initialization, mounting, and event handling, shielding integrators from the internal complexities of the web component and `OdinPay.js`.
*   **Clear Separation of Concerns:**
    *   The core component (`@exerp/odin-dropin-core`) is responsible for the direct interaction with `OdinPay.js` and rendering the payment UI.
    *   The facade package (`@exerp/odin-dropin`) handles the public API, component lifecycle management, and adapting host configurations for the core component.
*   **Security:** Leverages `OdinPay.js` for handling sensitive payment information directly within iframes provided by ODIN, minimizing PCI scope for the host application. The drop-in component itself does not directly handle or store raw payment details.
*   **Extensibility:** The architecture is designed to accommodate future enhancements. It has already demonstrated this by adding support for Bank Account payments and incorporating advanced features like real-time field validation feedback (via `onChangeValidation` from OdinPay.js v2). Further payment methods or features can be added by extending existing components within the core package and exposing them through the facade.
*   **Developer Experience:** A local demo application and clear documentation aim to provide a smooth development and testing workflow for both contributors to the library and integrators.

## 3. System Components

The ODIN Drop-in workspace is a monorepo containing several key packages that work together to deliver the final component library and development environment.

### 3.1. Root Workspace

*   **Management:** The monorepo is managed using [Turborepo](https://turbo.build/repo) for efficient task orchestration (builds, development servers) and caching.
*   **Package Management:** [pnpm](https://pnpm.io/) is used for dependency management, leveraging its workspace features to link local packages.
*   **Configuration:** Includes root configuration files such as `turbo.json`, `pnpm-workspace.yaml`, and `tsconfig.base.json` to maintain consistency across the workspace.

### 3.2. `@exerp/odin-dropin-core` (Core Package - `packages/core`)

*   **Technology:** [Stencil.js](https://stenciljs.com/) (for creating standard Web Components).
*   **Purpose:** This internal package provides the fundamental building block(s) for the payment UI. It is not intended for direct consumption by host applications.
*   **Key Component(s):**
    *   `<exerp-odin-cc-form>`: The primary web component responsible for payment detail capture. It can render forms for both Credit Card and Bank Account payments based on configuration.
    *   Importing and initializing ODIN's `OdinPay.js` v2 library from the `@clubessentialholdings/js-elements` NPM package.
    *   Initializing the `OdinPay` object using the `odinPublicToken` and a theme object. The theme is either passed down from the facade (originating from the host application's configuration) or defaults to an empty object (`{}`) to allow OdinPay.js v2's native styles to apply.
    *   Configuring and rendering the payment input fields for both Card and Bank Account types using `OdinPay.createCardForm()` or `OdinPay.createBankAccountForm()`. This includes:
        *   Providing CSS selectors for where OdinPay.js should mount its iframe-based input fields.
        *   Passing an `onChangeValidation` handler to OdinPay.js to receive real-time, field-level validation events.
    *   Handling callbacks from `OdinPay.js` upon form submission:
        *   For successful submissions, extracting payment method details (including `id`, `type`, `billingInformation`, and specific card/bank account data).
        *   For failed submissions, processing the `result.errors` array (from OdinPay.js v2) to construct a structured error payload.
    *   Emitting internal events (`odinSubmitInternal` with `OdinPaySubmitPayload`, `odinErrorInternal` with `OdinPayErrorPayload`) to communicate results or errors to the facade.
    *   Managing its own minimal CSS for the basic structure of elements it renders directly (e.g., field labels, containers like `div.odin-field-container`), and is configured with `shadow: false` to allow easy host styling of these elements.
*   **Outputs:** Standard Web Components, consumed by the `@exerp/odin-dropin` facade package via its `dist-custom-elements` output.

### 3.3. `@exerp/odin-dropin` (Facade Package - `packages/odin-dropin`)

*   **Technology:** TypeScript, [Vite](https://vitejs.dev/) (for bundling in library mode).
*   **Purpose:** This is the main, public-facing library that host applications install and use.
*   **Key Responsibilities:**
    *   Managing the lifecycle of the core web component (`<exerp-odin-cc-form>`):
    *   Receiving configuration from the host application via `OdinDropinInitializationParams`. This includes parameters such as `odinPublicToken`, `countryCode`, `paymentMethodType` ('CARD' or 'BANK_ACCOUNT'), `billingFieldsConfig`, the new OdinPay.js v2 `theme` object (`OdinV2ThemeConfig`), and callback functions (`onSubmit`, `onError`, and the new `onChangeValidation`). (Note: `isSingleUse` has been removed as it's deprecated in OdinPay.js v2).
    *   Creating an instance of the `<exerp-odin-cc-form>` web component.
    *   Passing necessary properties (props) to the web component, including `odinPublicToken`, `countryCode`, `paymentMethodType`, `billingFieldsConfig`, the `themeConfigProp` (derived from the user's theme input), and the `onChangeValidation` handler.
    *   Attaching event listeners to the web component to capture `odinSubmitInternal` and `odinErrorInternal` events.
    *   Invoking the host application's `onSubmit`, `onError`, or `onChangeValidation` callbacks with appropriately structured payloads.
    *   Handling mounting (`mount()`) and unmounting (`unmount()`) of the web component in the host application's DOM.
*   **Outputs:** Distributable library bundles in various formats (ESM, UMD, CJS) and corresponding TypeScript declaration files (`.d.ts`).

### 3.4. `@exerp/odin-dropin-demo` (Demo Application - `apps/demo`)

*   **Technology:** Vue 3, TypeScript, [Vite](https://vitejs.dev/).
*   **Purpose:** Serves as a local development environment for testing the `@exerp/odin-dropin` facade and, by extension, the core components. It also acts as a practical usage example.
*   **Key Responsibilities:**
    *   Demonstrating how to import, initialize, configure (with `odinPublicToken`, `paymentMethodType`, `billingFieldsConfig`, the OdinPay.js v2 `theme` object, and callbacks like `onSubmit`, `onError`, `onChangeValidation`), and mount the `OdinDropin` instance.
    *   Providing a UI to input necessary configurations, including the public token, country code, payment method type, billing field selections, and a theme object JSON.
    *   Displaying the results from the drop-in component, including successful payment method details (`OdinSubmitPayload`), structured errors (`OdinPayErrorPayload`), and real-time field validation events (`OdinFieldValidationEvent`).
    *   Illustrating the OdinPay.js v2 styling approach by showing how to pass a theme object for internal field styling and how to apply external CSS for container styling (borders, etc.).
*   **Consumption:** Uses the `@exerp/odin-dropin` package via pnpm workspace linking (`workspace:*`).

## 4. Key Data Flows & Interactions

This section outlines the primary sequences of operations and data exchange within the ODIN Drop-in component system.

### 4.1. Initialization Flow

The process of initializing and displaying the ODIN Drop-in component typically follows these steps:

1.  **Host Application:**
    *   Fetches a short-lived `odinPublicToken` from its backend (which, in turn, retrieves it from the ODIN /auth2/public-token API).
    *   Identifies a DOM element where the drop-in UI will be rendered.
2.  **Facade Package (`@exerp/odin-dropin` - `OdinDropin` class):**
    *   The host application instantiates `new OdinDropin()`, providing:
        *   The `odinPublicToken`.
        *   The **mandatory** `countryCode` ('US' or 'CA').
        *   An optional `paymentMethodType` (`'CARD'` or `'BANK_ACCOUNT'`, defaults to `'CARD'`).
        *   Optional `isSingleUse` flag.
        *   Optional **`billingFieldsConfig`** object (e.g., `{ name: true, addressLine1: { label: 'Street Address' } }`) to enable optional fields and customize labels/placeholders. Refer to the `BillingFieldsConfig` type for details. 
        *   Callback functions (`onSubmit`, `onError`).
        *   Optional general configuration (`config.theme` - currently deferred for full implementation).
3.  **Facade Package (Mounting):**
    *   The host application calls the `odinDropinInstance.mount(selectorOrElement)` method.
    *   The facade creates an instance of the `<exerp-odin-cc-form>` web component.
    *   It sets the `odinPublicToken`, **`countryCode`**, **`isSingleUse`**, and **`billingFieldsConfig`** properties on the web component instance.
    *   It attaches event listeners for `odinSubmitInternal` and `odinErrorInternal` events emitted by the web component.
    *   The web component is appended to the specified DOM mount point.
4.  **Core Package (`@exerp/odin-dropin-core` - `<exerp-odin-cc-form>` component):**
    *   The component's lifecycle methods (e.g., `componentDidLoad`, `componentDidUpdate`, and `@Watch`ers for key props like `odinPublicToken`, `countryCode`, `paymentMethodType`) manage the initialization sequence.
    *   It utilizes the `OdinPay` constructor imported from the `@clubessentialholdings/js-elements` NPM package.
    *   It initializes the `OdinPay` object using the `odinPublicToken` and the `theme` object passed as a prop from the facade (or an empty object `{}` if no theme was provided, to use OdinPay.js v2 defaults).
    *   Once the `OdinPay` instance is ready and the component has rendered, it calls `OdinPay.createCardForm()` or `OdinPay.createBankAccountForm()` based on its `paymentMethodType` prop. These methods are provided with:
        *   CSS selectors for the DOM elements (rendered by the core component) where OdinPay.js should mount its input fields.
        *   The `onChangeValidation` handler (an internal method that forwards to the facade's callback if provided).
        *   Configuration for enabled billing fields.
        *   An internal callback for handling submission results.
    *   *(Note: The `isSingleUse` flag is no longer passed as it's deprecated in OdinPay.js v2.)*

5.  **`OdinPay.js`:**
    *   Renders the secure input fields (iframes) into the designated DOM elements within the `<exerp-odin-cc-form>` component.

### 4.2. Submission Flow

When the user interacts with the form and initiates a submission:

1.  **User Interaction:**
    *   The user fills in the payment details.
    *   The user clicks the "Pay" button (the visible submit button provided by the `<exerp-odin-cc-form>` component).
2.  **Core Package (`<exerp-odin-cc-form>` component):**
    *   The click handler for the visible submit button (`handleVisibleSubmitClick`) programmatically clicks the hidden submit button that `OdinPay.js` is configured to use.
    *   `isLoading` state is set to `true`, disabling the visible button and potentially showing a loading indicator.
3.  **`OdinPay.js`:**
    *   Captures the payment details from its iframes.
    *   Communicates with ODIN servers to tokenize the payment information.
    *   Invokes the callback function provided to `createCardForm()`'s or `createBankAccountForm()`'s `submitButton.callback` option, passing a `result` object.
        *   If successful (`result.success === true`), `result.paymentMethod` contains details like `id`, `type` ("CREDIT_CARD", "DEBIT_CARD" or "BANK_ACCOUNT"), `createdAt`, `updatedAt`, `billingInformation`, and payment method-specific fields (e.g., `cardBrand`, masked `accountNumber`, `expirationDate` for cards; or `bankAccountType`, masked `accountNumber`, `routingNumber`, etc., for bank accounts).
        *   If unsuccessful (`result.success === false`), the `result` object will typically contain an `errors` array detailing the issues.
4.  **Core Package (`<exerp-odin-cc-form>` component - OdinPay Callback):**
    *   The internal callback function within the core component receives the `result` object from `OdinPay.js`.
    *   If `result.success === true` and `result.paymentMethod.id` is present:
        *   It extracts `paymentMethodId`, `billingInformation` (if present), and payment method-specific details (e.g., card brand, last4 for cards; bank account type, last4 for bank accounts) from `result.paymentMethod`.
        *   It emits an `odinSubmitInternal` event with an `OdinPaySubmitPayload` containing these details, including a `paymentMethodType` (derived from `result.paymentMethod.type`) and a `details` object specific to the payment method.
    *   If `result.success === false`:
        *   It primarily processes the `result.errors` array (provided by OdinPay.js v2), where each item is a structured `ErrorObject` containing `fieldName`, `errorCode`, `type`, etc. These are mapped to create our `OdinPayErrorPayload`.
        *   If `result.errors` is not available, it falls back to parsing the older `result.message` format.
        *   It then emits an `odinErrorInternal` event with the constructed `OdinPayErrorPayload`. This payload includes:
            *   A `code` (e.g., `VALIDATION_ERROR_FIELDS`, `API_ERROR`).
            *   A general `message`.
            *   An optional `fieldErrors` array, where each item has a `field` (the `fieldName` from OdinPay.js) and a `message` (typically the `errorCode` from OdinPay.js, like `"REQUIRED"` or `"INVALID_CARD_INFORMATION"`).
            *   An optional `httpStatusCode`.
            *   An optional `rawError` containing the original error data from OdinPay.js.
    *   The `isLoading` state is set to `false`. Error messages from `initializationError` or (less commonly now) `callbackError` might be displayed directly in the component's UI for immediate basic feedback.
5.  **Facade Package (`OdinDropin` class):**
    *   The event listener for `odinSubmitInternal` (or `odinErrorInternal`) is triggered.
    *   It calls the corresponding `onSubmit` callback or `onError` callback provided by the host application during initialization.
    *   For `onSubmit`, the payload is an `OdinSubmitPayload` object containing:
        *   `paymentMethodId` (`string`): ...
        *   `paymentMethodType` (`'CARD' | 'BANK_ACCOUNT'`): Indicates the type of payment method.
        *   `billingInformation?` (`OdinPayBillingInformation`): ...
        *   `details?` (`CardPaymentMethodDetails | AchPaymentMethodDetails`): Optional object with details specific to the `paymentMethodType`. `paymentMethodType`. 
            * For `'CARD'`, this includes:
                *   `cardBrand?` (`string`)
                *   `last4?` (`string`)
                *   `maskedAccountNumber?` (`string`)
                *   `expirationDate?` (`string`)
                *   `binDetails?` (`any`)
            *   For `'BANK_ACCOUNT'`, this includes: `bankAccountType?`, `accountNumberLast4?`, `routingNumber?` (US), `transitNumber?` (CA), `institutionNumber?` (CA), `country?`.
    *   For `onError`, the payload is the structured `OdinPayErrorPayload`.

6.  **Host Application:**
    *   Receives the `OdinSubmitPayload` (on success) or `OdinPayErrorPayload` (on failure).
    *   On success, it can use the `paymentMethodId` for backend processing, `paymentMethodType` to understand the `details` object, and display relevant information like `cardBrand`, `last4`, or `billingInformation` to the user.
    *   Proceeds with its application-specific logic.

### 4.3. Error Handling Flow

Errors are now consistently reported to the host application via the `onError` callback, using a structured `OdinPayErrorPayload`.

*   **Error Sources and Propagation:**
    1.  **Initialization Errors (Core Component):**
        *   If `OdinPay.js` fails to load, the `OdinPay()` constructor throws an error (e.g., invalid key, SDK loading failure), or `createCardForm()` fails during setup, the core component (`<exerp-odin-cc-form>`) catches these exceptions.
        *   It then emits an `odinErrorInternal` event with a structured `OdinPayErrorPayload`. The `code` will indicate the type of initialization failure (e.g., `INIT_BADLY_FORMATTED_KEY`, `INIT_BT_SDK_FAILURE`), and the `message` will contain the original error message from `OdinPay.js` or the Stencil component.
    2.  **Submission Errors (`OdinPay.js` Callback):**
        *   If the `OdinPay.js` `submitButton.callback` (for `createCardForm` or `createBankAccountForm`) returns `result.success === false`, the core component (`<exerp-odin-cc-form>`) now primarily processes the `result.errors` array. This array, new in OdinPay.js v2, contains structured `ErrorObject` items detailing each issue.
        *   **Processing `result.errors`:**
            *   The core component iterates through each `ErrorObject`. Typically, an `ErrorObject` includes `fieldName`, `errorCode` (e.g., `"REQUIRED"`, `"INVALID_CARD_INFORMATION"`), and `type` (e.g., `"FIELD_VALIDATION"`, `"BACKEND"`).
            *   These are mapped to populate the `fieldErrors` array in our `OdinPayErrorPayload`, where `field` becomes `ErrorObject.fieldName` and `message` becomes `ErrorObject.errorCode`.
            *   The overall `code` for the `OdinPayErrorPayload` is determined (e.g., `VALIDATION_ERROR_FIELDS` if `ErrorObject.type` is `"FIELD_VALIDATION"`, or `API_ERROR` if `ErrorObject.type` is `"BACKEND"`).
        *   **Fallback to `result.message`:** If `result.errors` is not present or empty (which would be unusual for OdinPay.js v2 errors but provides a fallback), the component attempts to parse `result.message` (the v1-style error reporting) to construct the error payload. This might involve interpreting string, object, or array formats for `result.message`.
        *   The core component then emits an `odinErrorInternal` event with the fully constructed, structured `OdinPayErrorPayload`.
    3.  **Facade Errors:**
        *   If the facade (`OdinDropin` class) encounters an error before the core component is involved (e.g., mount point not found, component creation failed), it directly calls the host's `onError` callback with an `OdinPayErrorPayload` containing an appropriate `code` (e.g., `MOUNT_POINT_NOT_FOUND`) and `message`.

*   **Host Application (`onError` Callback):**
    *   The host application receives the `OdinPayErrorPayload` object.
    *   It should inspect the `code` for programmatic decision-making or categorization.
    *   The `message` provides a general, human-readable summary.
    *   If `fieldErrors` is present, the host can iterate through it to display errors next to specific form inputs or in a summary list.
    *   If `httpStatusCode` is present, it can be used for more specific logging or conditional logic (e.g., prompting re-authentication on a 401).

This standardized error structure allows the host application to more effectively handle and display errors from various stages of the drop-in's lifecycle. The internal error display within the `<exerp-odin-cc-form>` component (e.g., `initializationError`) still shows basic messages directly in the UI for immediate feedback.

## 5. Styling and Theming Strategy

The ODIN Drop-in component is designed to offer a balance between providing a consistent base appearance and allowing host applications to customize it to fit their branding.

### 5.1. Core Component Styling (`@exerp/odin-dropin-core`) and OdinPay.js v2 Theming

*   **No Shadow DOM:** The `<exerp-odin-cc-form>` web component is configured with `shadow: false`. Its internal styles are applied directly to the document, allowing host applications to override them.
*   **Core Component's Own CSS:** The component uses `exerp-odin-cc-form.css` for basic layout and structure of elements it renders directly (e.g., the overall container, field labels, the `div.odin-field-container` wrappers for OdinPay.js fields, the visible submit button, error message displays).
*   **`OdinPay.js` v2 Input Field Styling (via Theme Object):**
    *   The actual payment input fields (card number, expiry, CVC, bank account details, etc.) are rendered by OdinPay.js v2 within iframes.
    *   The `<exerp-odin-cc-form>` component receives a theme configuration object (as `themeConfigProp`) from the `@exerp/odin-dropin` facade. This theme object must conform to OdinPay.js v2's **flat structure**, allowing CSS properties (like `fontFamily`, `fontSize`, `color`, `backgroundColor`, `padding`) and pseudo-selectors (like `::placeholder`, `:hover`, `:focus`, `invalid`) to be applied directly.
    *   This theme object is passed to `OdinPay()` during its initialization. It styles the elements *inside* the OdinPay.js iframes.
    *   If no theme is provided by the host application (via the facade), the core component passes an empty theme object (`{}`) to `OdinPay()`, allowing OdinPay.js v2's own default internal styles to apply.
    *   **Crucially, the OdinPay.js v2 theme object does NOT control borders, box-shadows, or the overall structural styling (e.g., dimensions, margins) of the containers into which the iframe fields are mounted.** These aspects must be styled externally by the host application (see Section 5.2).

### 5.2. Host Application Styling Strategy for v2

With OdinPay.js v2, host applications have a two-pronged approach to customize the appearance of the ODIN Drop-in:

1.  **Styling OdinPay.js Internal Fields (via `theme` prop):**
    *   To customize the appearance of elements *inside* the OdinPay.js iframes (e.g., input text font, color, background color, padding, placeholder styles, hover/focus effects on inputs), the host application provides an `OdinV2ThemeConfig` object to the `theme` parameter of the `OdinDropin` constructor.
    *   This theme object must follow OdinPay.js v2's flat structure. Refer to the `@exerp/odin-dropin` README.md for examples.

2.  **Styling Drop-in Component Structure and Field Containers (via External CSS):**
    *   Due to the `<exerp-odin-cc-form>` web component using `shadow: false`, host applications can directly apply CSS to style:
        *   **Field Containers:** The `div` elements that `<exerp-odin-cc-form>` renders to host each OdinPay.js input field (or group of fields like Card Information). These containers typically have a class like `.odin-input` (where OdinPay mounts its field) and are wrapped by `.odin-field-container`. **This is where styles like `border`, `border-radius`, `box-shadow`, and `background-color` for the input "boxes" must be applied.**
        *   **Other Drop-in Elements:** Elements rendered directly by `<exerp-odin-cc-form>`, such as the main submit button (`.odin-submit-button`), field labels, and error message containers.
    *   This allows the host application to integrate the drop-in's structural appearance (borders, spacing, button styles) seamlessly with its own design system.
    *   The `apps/demo` application provides examples of this external CSS styling.

*   **Layout and Sizing:** The host application continues to control the overall size (e.g., `max-width`) and positioning of the entire drop-in component by styling the container element into which `OdinDropin` is mounted.

## 6. Development & Testing Workflow Overview

The monorepo is set up to facilitate an efficient development and testing workflow for the ODIN Drop-in component library.

*   **Isolated Core Component Development:**
    *   Developers can work on the Stencil.js web components (`@exerp/odin-dropin-core`) in isolation.
    *   Running `pnpm start` within the `packages/core` directory launches the Stencil development server, typically serving an `index.html` page that renders the component for direct testing and iteration with Hot Module Replacement (HMR).
*   **Integrated Facade and Demo App Development:**
    *   The `@exerp/odin-dropin-demo` application (`apps/demo`) serves as the primary environment for testing the complete drop-in functionality as a host application would consume it.
    *   It uses the `@exerp/odin-dropin` facade package via pnpm workspace linking, ensuring that changes in the facade (and its underlying core component dependency) are reflected in the demo app after rebuilding the necessary packages.
    *   Running `pnpm dev --filter @exerp/odin-dropin-demo` from the monorepo root starts the Vite development server for the demo app.
*   **Building Packages:**
    *   `pnpm turbo build` from the root directory builds all packages in the correct order, producing distributable artifacts for `core` and `odin-dropin`.
*   **External Project Linking:**
    *   For testing in a real-world host application during development (e.g., `webapp-standard`), the `@exerp/odin-dropin` package can be linked locally using `pnpm add /path/to/local/package`.
*   **Detailed Commands and Setup:**
    *   For essential development commands, refer to the [Quick Start Guide](../../QUICK_START.md).
    *   For instructions on linking and testing with an external local project, see the [Local Development Setup Guide](../../docs/LOCAL_DEVELOPMENT_AND_PUBLISHING.md).
