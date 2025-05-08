# Exerp ODIN Payment Drop-in Component

[![License: UNLICENSED](https://img.shields.io/badge/License-UNLICENSED-lightgrey.svg)](LICENSE) <!-- Adjust if license changes -->
<!-- TODO: Add build status badge later -->

## Overview

This repository contains the source code for the Exerp ODIN Payment Drop-in, a reusable JavaScript component library designed to securely capture payment details within web applications. It acts as a wrapper around ODIN's official `OdinPay.js` library, providing a simplified interface for integration, similar in concept to solutions like Adyen Web Drop-in or Stripe Elements.

**Purpose:** To allow host applications (like Exerp's customer-facing web apps or partner integrations) to embed a UI component that handles the collection of sensitive payment information (Credit Card initially, ACH planned) directly from the user in a secure manner, tokenizing the details via ODIN for subsequent backend processing.

## Status (as of May 2025)

*   **Phase:** MVP (Minimum Viable Product) Complete.
*   **Supported Features:**
    *   Secure capture of Credit Card details (Number, Expiry, CVC, Postal Code) for one-time payments.
    *   Tokenization of card details via `OdinPay.js`.
    *   Communication of `paymentMethodId` or errors back to the host application via callbacks.
    *   Basic theming support for input fields (via `OdinPay.js` theme object).
    *   Host application-driven styling for the submit button and layout.
*   **Key Technologies:** Built as standard Web Components using [Stencil.js](https://stenciljs.com/), bundled with [Vite](https://vitejs.dev/), and managed in a [Turborepo](https://turbo.build/repo) monorepo with [pnpm](https://pnpm.io/).


## Packages in this Monorepo

This workspace uses [pnpm workspaces](https://pnpm.io/workspaces) and includes the following packages:

*   `packages/odin-dropin` (`@exerp/odin-dropin`): The primary, public-facing facade library. This is the package that host applications should install and import. It provides the `OdinDropin` class for initializing and mounting the component.
*   `packages/core` (`@exerp/odin-dropin-core`): An internal package containing the core Web Component(s) built with Stencil.js (e.g., `<exerp-odin-cc-form>`). This package is consumed by `@exerp/odin-dropin`. Host applications should *not* depend on this directly.
*   **`apps/demo` (`@exerp/odin-dropin-demo`)**: A simple Vue 3 + TypeScript demo application used for local development and testing of the `@exerp/odin-dropin` package. See its [README](apps/demo/README.md) for more details on its purpose.

## Getting Started for Developers (Working in this Repo)

Follow these steps to set up the development environment for this monorepo.

**Prerequisites:**

*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [pnpm](https://pnpm.io/installation) (v9.0.0 or compatible specified in root `package.json`)

**Installation:**

Clone the repository and install all dependencies from the workspace root:

```bash
git clone <repository-url>
cd <repository-directory>
pnpm install
```

**Building the Library:**

To build the distributable artifacts for both the `core` and `odin-dropin` packages:

```bash
# Run from the workspace root
pnpm turbo build
```
Build outputs are located in the `dist` directory within each package (e.g., `packages/odin-dropin/dist`).

**Running the Demo App:**

To run the local Vue demo application for interactive testing:

```bash
# Run from the workspace root
pnpm dev --filter @exerp/odin-dropin-demo
```
This will start the Vite development server, typically available at `http://localhost:5173`.

For more detailed development commands (like isolated component testing), see [QUICK_START.md](QUICK_START.md).


## Basic Usage (for Host Applications)

Here's a minimal example of how to use the `@exerp/odin-dropin` package in a plain HTML/JavaScript setup:

1.  **Installation:**
    ```bash
    # Using pnpm
    pnpm add @exerp/odin-dropin

    # Using npm
    npm install @exerp/odin-dropin

    # Using yarn
    yarn add @exerp/odin-dropin
    ```

2.  **HTML:**
    Create a container element where the drop-in will be mounted.
    ```html
    <!DOCTYPE html>
    <html>
    <head>
        <title>Odin Drop-in Test</title>
        <!-- Include your CSS here -->
        <style>
            /* Basic button styling for this example */
            .odin-submit-button {
                padding: 10px 15px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            }
            .odin-submit-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            #odin-container {
                max-width: 400px;
                padding: 20px;
                border: 1px solid #ccc;
                margin: 20px;
            }
            .error-message {
                color: red;
                margin-top: 10px;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <h1>Odin Payment Form</h1>
        <div id="odin-container">
            <!-- The drop-in will be mounted here -->
        </div>
        <div id="result-display"></div>
        <div id="error-display" class="error-message"></div>

        <script type="module" src="app.js"></script>
    </body>
    </html>
    ```

3.  **JavaScript (`app.js`):**
    Import the `OdinDropin` class, instantiate it with your configuration (including the ODIN Public Token fetched from your backend), and mount it.

    ```javascript
    // app.js
    import { OdinDropin } from '@exerp/odin-dropin';

    // --- Configuration ---
    const odinContainerSelector = '#odin-container';
    const resultDisplay = document.getElementById('result-display');
    const errorDisplay = document.getElementById('error-display');

    // IMPORTANT: You MUST fetch a short-lived ODIN Public Token
    // from your backend securely before initializing the drop-in.
    // Replace this with your actual token fetching logic.
    const odinPublicToken = 'paste-your-fetched-public-token-here';

    if (!odinPublicToken || odinPublicToken === 'paste-your-fetched-public-token-here') {
        console.error("Error: ODIN Public Token is missing or placeholder.");
        if (errorDisplay) errorDisplay.textContent = 'Configuration error: ODIN Public Token not provided.';
        // Handle missing token appropriately (e.g., don't initialize)
        // For this example, we stop here if the token is missing.
    } else {
        try {
            // --- Initialize OdinDropin ---
            const odinDropinInstance = new OdinDropin({
                odinPublicToken: odinPublicToken,
                isSingleUse: true, // Set based on your use case (true for one-time, false for saving)

                // Define callbacks
                onSubmit: (result) => {
                    console.log('Drop-in onSubmit:', result);
                    if (resultDisplay) {
                        resultDisplay.textContent = `Success! Payment Method ID: ${result.paymentMethodId}`;
                    }
                    if (errorDisplay) errorDisplay.textContent = ''; // Clear errors
                    // --- Next Step ---
                    // Send result.paymentMethodId to your backend
                    // to complete the payment or save the payment method.
                },
                onError: (error) => {
                    console.error('Drop-in onError:', error);
                    if (errorDisplay) {
                         // Use the message provided in the error payload
                        errorDisplay.textContent = `Error: ${error.message || 'An unknown error occurred.'}`;
                    }
                   if (resultDisplay) resultDisplay.textContent = ''; // Clear success message
                },

                // Optional config (e.g., for basic theme adjustments for OdinPay.js inputs)
                // config: {
                //   theme: { input: { base: { color: '#333' } } }
                // }
            });

            // --- Mount the Drop-in ---
            odinDropinInstance.mount(odinContainerSelector);

            console.log('Odin Drop-in mounted successfully.');

        } catch (initError) {
            console.error("Failed to initialize OdinDropin:", initError);
            if (errorDisplay) errorDisplay.textContent = `Initialization failed: ${initError.message || initError}`;
        }
    }
    ```

> **Note:** This is a basic example. Refer to the [`@exerp/odin-dropin` package's README](packages/odin-dropin/README.md) for detailed API documentation and advanced configuration options.

## Local Development with External Projects

If you need to test the `@exerp/odin-dropin` package within another local project (e.g., `webapp-standard`) before publishing, you can use `pnpm add /path/to/local/package` to link it.

For detailed instructions on this workflow, please see [LOCAL_DEVELOPMENT_SETUP.md](LOCAL_DEVELOPMENT_SETUP.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.