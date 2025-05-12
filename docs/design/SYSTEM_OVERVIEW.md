# ODIN Drop-in Component - System Overview

## 1. Introduction

The Exerp ODIN Payment Drop-in is a reusable JavaScript component library designed to simplify the secure capture of payment details within host web applications. Its primary goal is to provide a streamlined and secure way for integrators to embed ODIN Payments functionality, abstracting the direct complexities of ODIN's `OdinPay.js` library.

This component allows Exerp's customers and partners to embed a UI that handles the collection of sensitive payment information (initially Credit Card details) directly from the user, tokenizing these details via ODIN for subsequent backend processing.

This document provides a high-level overview of the current system architecture, its main components, and key design principles. For details on the initial Minimum Viable Product (MVP) specification, refer to the [MVP Design Document](./DESIGN_DOC_MVP.md).

## 2. Core Architectural Principles

The ODIN Drop-in component is built upon the following core architectural principles:

*   **Framework-Agnosticism:** The core UI is built using standard Web Components (via Stencil.js), ensuring compatibility across various frontend frameworks (Vue, React, Angular, plain JavaScript, etc.) or no framework at all.
*   **Simplified Integration (Facade Pattern):** A dedicated facade package (`@exerp/odin-dropin`) provides a clean, high-level API (`OdinDropin` class) that simplifies initialization, mounting, and event handling, shielding integrators from the internal complexities of the web component and `OdinPay.js`.
*   **Clear Separation of Concerns:**
    *   The core component (`@exerp/odin-dropin-core`) is responsible for the direct interaction with `OdinPay.js` and rendering the payment UI.
    *   The facade package (`@exerp/odin-dropin`) handles the public API, component lifecycle management, and adapting host configurations for the core component.
*   **Security:** Leverages `OdinPay.js` for handling sensitive payment information directly within iframes provided by ODIN, minimizing PCI scope for the host application. The drop-in component itself does not directly handle or store raw payment details.
*   **Extensibility:** The architecture is designed to accommodate future enhancements, such as support for additional payment methods (e.g., ACH) and more advanced features, by adding new components or extending existing ones within the core package and exposing them through the facade.
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
    *   `<exerp-odin-cc-form>`: The primary web component responsible for credit card detail capture.
*   **Key Responsibilities:**
    *   Dynamically loading and initializing ODIN's `OdinPay.js` library.
    *   Configuring and rendering the payment input fields (e.g., card number, expiry, CVC, postal code) using `OdinPay.createCardForm()`.
    *   Handling callbacks from `OdinPay.js` upon form submission or error.
    *   Emitting internal events (`odinSubmitInternal`, `odinErrorInternal`) to communicate results or errors to the facade.
    *   Managing its own CSS for basic structure and appearance (with `shadow: false`, allowing host styling).
*   **Outputs:** Standard Web Components, consumed by the `@exerp/odin-dropin` facade package via its `dist-custom-elements` output.

### 3.3. `@exerp/odin-dropin` (Facade Package - `packages/odin-dropin`)

*   **Technology:** TypeScript, [Vite](https://vitejs.dev/) (for bundling in library mode).
*   **Purpose:** This is the main, public-facing library that host applications install and use.
*   **Key Responsibilities:**
    *   Exporting the primary `OdinDropin` class as the main entry point for integration.
    *   Managing the lifecycle of the core web component (`<exerp-odin-cc-form>`):
        *   Receiving configuration from the host application (e.g., `odinPublicToken`, **`countryCode`**, `isSingleUse`, **`billingFieldsConfig`**, callbacks).
        *   Creating an instance of the web component (`document.createElement('exerp-odin-cc-form')`).
        *   Passing necessary properties (props) to the web component (**`odinPublicToken`**, **`countryCode`**, **`isSingleUse`**, **`billingFieldsConfig`**).
        *   Attaching event listeners to the web component to capture `odinSubmitInternal` and `odinErrorInternal` events.
        *   Invoking the host application's `onSubmit` or `onError` callbacks with the processed results.
        *   Handling mounting (`mount()`) and unmounting (`unmount()`) of the web component in the host application's DOM.
*   **Outputs:** Distributable library bundles in various formats (ESM, UMD, CJS) and corresponding TypeScript declaration files (`.d.ts`).

### 3.4. `@exerp/odin-dropin-demo` (Demo Application - `apps/demo`)

*   **Technology:** Vue 3, TypeScript, [Vite](https://vitejs.dev/).
*   **Purpose:** Serves as a local development environment for testing the `@exerp/odin-dropin` facade and, by extension, the core components. It also acts as a practical usage example.
*   **Key Responsibilities:**
    *   Demonstrating how to import, initialize, configure (with `odinPublicToken`, callbacks), and mount the `OdinDropin` instance.
    *   Providing a UI to input necessary configuration (like the public token).
    *   Displaying the results (`paymentMethodId`) or errors received from the drop-in component.
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
        *   Optional `isSingleUse` flag.
        *   Optional **`billingFieldsConfig`** object (e.g., `{ name: true, addressLine1: { label: 'Street Address' } }`) to enable optional fields and customize labels/placeholders. Refer to the `BillingFieldsConfig` type for details. 
        *   Callback functions (`onSubmit`, `onError`).
        *   Optional general configuration (`config.theme` - currently deferred for full implementation).
3.  **Facade Package (Mounting):**
    *   The host application calls the `odinDropinInstance.mount(selectorOrElement)` method.
    *   The facade creates an instance of the `<exerp-odin-cc-form>` web component (`document.createElement('exerp-odin-cc-form')`).
    *   It sets the `odinPublicToken`, **`countryCode`**, **`isSingleUse`**, and **`billingFieldsConfig`** properties on the web component instance.
    *   It attaches event listeners for `odinSubmitInternal` and `odinErrorInternal` events emitted by the web component.
    *   The web component is appended to the specified DOM mount point.
4.  **Core Package (`@exerp/odin-dropin-core` - `<exerp-odin-cc-form>` component):**
    *   Upon being added to the DOM and receiving props (especially `odinPublicToken`, `countryCode`), the component's `componentDidLoad` (or `watch` handlers) trigger.
    *   It dynamically loads the external `OdinPay.js` script if not already loaded.
    *   It initializes the `OdinPay` object using the `odinPublicToken`, **`countryCode`**, and a pre-defined theme structure (workaround for library bug).
    *   It calls `odinPayInstance.createCardForm()`, providing selectors for the DOM elements within its template where `OdinPay.js` will inject the payment input iframes (Card Information, Postal Code, and **conditionally Name on Card or other enabled billing fields**). It also passes the `isSingleUse` flag and configurations for the **enabled billing fields** and the internal submit callback.
4.  **Core Package (`@exerp/odin-dropin-core` - `<exerp-odin-cc-form>` component):**
    *   Upon being added to the DOM and receiving the `odinPublicToken` prop, the component's `componentDidLoad` (or `watch` on `odinPublicToken`) lifecycle method triggers.
    *   It dynamically loads the external `OdinPay.js` script if not already loaded.
    *   It initializes the `OdinPay` object using the `odinPublicToken` and a pre-defined (currently hardcoded) theme.
    *   It calls `odinPayInstance.createCardForm()`, providing selectors for the DOM elements within its template where `OdinPay.js` will inject the payment input iframes (Card Information, Postal Code). It also passes the `isSingleUse` flag and a callback for the OdinPay-provided submit button.
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
    *   Invokes the callback function provided to `createCardForm`'s `submitButton.callback` option, passing a result object. If successful, `result.paymentMethod` contains the id and potentially a `billingInformation` object (with keys like `name`, `emailAddress`, and a nested address object: `{ addressLine1, city, postalCode, ... }`) if billing fields were configured and submitted
4.  **Core Package (`<exerp-odin-cc-form>` component - OdinPay Callback):**
    *   The callback function receives the `result` object from `OdinPay.js`.
    *   If `result.success === true` and `result.paymentMethod.id` is present:
        *   It extracts the `paymentMethodId` and any `billingInformation` from `result.paymentMethod`.
        *   It emits an `odinSubmitInternal` event with the payload `{ paymentMethodId, billingInformation? }`.
    *   If `result.success === false`:
        *   It parses the `result.message` (which can be a string, object, or array) to construct a structured error payload.
        *   It emits an `odinErrorInternal` event. The payload is an `OdinPayErrorPayload` object containing:
            *   `code` (e.g., `VALIDATION_ERROR_FIELDS`, `API_AUTH_ERROR`, `GENERAL_PAYMENT_ERROR`).
            *   `message` (a general error description).
            *   `fieldErrors?` (an array of `{field, message}` for validation issues).
            *   `httpStatusCode?` (the HTTP status for API errors).
    *   `isLoading` state is set to `false`. Any error message might be displayed in the component's UI.
5.  **Facade Package (`OdinDropin` class):**
    *   The event listener for `odinSubmitInternal` (or `odinErrorInternal`) is triggered.
    *   It calls the corresponding `onSubmit` callback (with `{ paymentMethodId }`) or `onError` callback (with the structured `OdinPayErrorPayload`) provided by the host application during initialization.
6.  **Host Application:**
    *   Receives the `paymentMethodId` and optional `billingInformation` (on success) or error details (on failure) and proceeds with its application-specific logic (e.g., sending the `paymentMethodId` to its backend for payment processing or displaying an error message to the user).

### 4.3. Error Handling Flow

Errors are now consistently reported to the host application via the `onError` callback, using a structured `OdinPayErrorPayload`.

*   **Error Sources and Propagation:**
    1.  **Initialization Errors (Core Component):**
        *   If `OdinPay.js` fails to load, the `OdinPay()` constructor throws an error (e.g., invalid key, SDK loading failure), or `createCardForm()` fails during setup, the core component (`<exerp-odin-cc-form>`) catches these exceptions.
        *   It then emits an `odinErrorInternal` event with a structured `OdinPayErrorPayload`. The `code` will indicate the type of initialization failure (e.g., `INIT_BADLY_FORMATTED_KEY`, `INIT_BT_SDK_FAILURE`), and the `message` will contain the original error message from `OdinPay.js` or the Stencil component.
    2.  **Submission Errors (`OdinPay.js` Callback):**
        *   If the `OdinPay.js` `submitButton.callback` returns `result.success === false`, the core component processes `result.message`.
        *   **Validation Errors:** If `result.message` is an object (field-specific) or an array (general), the core component sets the `code` to `VALIDATION_ERROR_FIELDS` or `VALIDATION_ERROR_GENERAL` and populates the `fieldErrors` array in the `OdinPayErrorPayload`.
        *   **API/General Errors:** If `result.message` is a string, the core component sets the `code` (e.g., `API_AUTH_ERROR`, `GENERAL_PAYMENT_ERROR`), potentially extracts an `httpStatusCode`, and sets the `message`.
        *   It then emits an `odinErrorInternal` event with this structured `OdinPayErrorPayload`.
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

### 5.1. Core Component Styling (`@exerp/odin-dropin-core`)

*   **No Shadow DOM:** The `<exerp-odin-cc-form>` web component is configured with `shadow: false`. This means that its internal styles are not encapsulated within a Shadow DOM boundary but are applied directly to the document.
*   **Internal CSS:** The component has its own CSS file (`exerp-odin-cc-form.css`) that defines the basic layout, structure, and minimal appearance for elements it renders directly (e.g., container divs, labels, the visible submit button, error message containers).
*   **`OdinPay.js` Input Field Styling:** The actual payment input fields (card number, expiry, CVC, postal code) are rendered by `OdinPay.js` as iframes.
    *   The `<exerp-odin-cc-form>` component passes a basic, hardcoded theme object during the `OdinPay()` initialization. This theme object allows for some control over the appearance of the inputs within the iframes (e.g., font family, font size, invalid state color), as supported by `OdinPay.js`.

### 5.2. Host Application Styling Capabilities

*   **Direct CSS Targeting:** Due to `shadow: false`, host applications can directly target and style the internal elements of the `<exerp-odin-cc-form>` component using standard CSS selectors (e.g., by targeting class names like `.odin-submit-button`, `.odin-field-container`, or element IDs if stable ones are exposed and documented). This provides significant flexibility for the host application to override default styles and align the component's look and feel with its own design system.
*   **Submit Button:** A key example is the submit button. While the core component provides a functional button, the host application is expected to apply its own styling to ensure visual consistency (as demonstrated in the `apps/demo` Vue application).
*   **Layout and Sizing:** The host application controls the overall size and positioning of the drop-in component by styling the container element into which it is mounted.

### 5.3. Future Theming Enhancements (Deferred)

*   **Theme Object Pass-through:** As noted in the [MVP Design Document](./DESIGN_DOC_MVP.md) and the [Feature Backlog](../../planning/FEATURE_BACKLOG.md), a future enhancement involves allowing the host application to pass a simplified theme object through the facade's `config.theme` option.
*   **Translation to `OdinPay.js` Theme:** The core component would then be responsible for translating this simplified theme object into the more detailed, nested theme structure expected by `OdinPay.js`, allowing for more dynamic customization of the iframe-rendered input fields by the host application.

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
    *   For instructions on linking and testing with an external local project, see the [Local Development Setup Guide](../../LOCAL_DEVELOPMENT_SETUP.md).

## 7. Future Development & Extensibility

The ODIN Drop-in component has been designed with extensibility in mind to support a growing range of payment functionalities.

*   **Planned Features:** Several enhancements and new features are planned beyond the initial MVP, including but not limited to:
    *   Support for ACH (Bank Account) payments.
    *   Enhanced theming capabilities.
    *   Optional billing field configurations.
    *   Management of payment agreements (Card-on-File / Recurring).
*   **Architectural Support for Extensibility:**
    *   New payment methods can be introduced by creating new Stencil web components within the `@exerp/odin-dropin-core` package, each handling the specific logic for that payment type (e.g., a new component for ACH that integrates with `OdinPay.createBankAccountForm()`).
    *   The `@exerp/odin-dropin` facade can then be extended to expose new methods or configuration options for initializing and mounting these new components.
*   **Detailed Backlog:** For a comprehensive list of planned features, enhancements, and their current status, please refer to the [Feature Backlog](../../planning/FEATURE_BACKLOG.md). This document will also serve as a starting point or link to more detailed design specifications for upcoming features as they are being developed.