# ODIN Payment Drop-in Component

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

This repository contains the source code for the ODIN Payment Drop-in, a reusable JavaScript component library designed to securely capture payment details within web applications. It acts as a wrapper around ODIN's official `OdinPay.js` library, providing a simplified interface for integration.

**Purpose:** To allow host applications (like Exerp's customer-facing web apps or partner integrations) to embed a UI component that handles the collection of sensitive payment information (Credit Card initially, ACH planned) directly from the user in a secure manner, tokenizing the details via ODIN for subsequent backend processing.

## Basic Usage (for Host Applications)

To integrate the ODIN Drop-in into your application:

1.  **Installation:**
    ```bash
    # Using pnpm
    pnpm add @exerp/odin-dropin

    # Using npm
    npm install @exerp/odin-dropin

    # Using yarn
    yarn add @exerp/odin-dropin
    ```

2.  **Integration:**
    Import the `OdinDropin` class, instantiate it with your configuration (including the ODIN Public Token fetched from your backend), and mount it.

    ```javascript
    // Example: app.js
    import { OdinDropin } from '@exerp/odin-dropin';

    // Fetch your ODIN_PUBLIC_TOKEN from your backend
    const odinPublicToken = 'YOUR_FETCHED_ODIN_PUBLIC_TOKEN';
    const userCountryCode = 'US'; // Or 'CA', determine from user context

    const odinDropinInstance = new OdinDropin({
      odinPublicToken: odinPublicToken,
      countryCode: userCountryCode,
      // billingFieldsConfig: { name: true }, // Uncomment to enable optional billing fields
      onSubmit: (result) => { console.log('Success:', result.paymentMethodId); /* ... */ },
      onError: (error) => { console.error('Error:', error.message); /* ... */ }
    });

    odinDropinInstance.mount('#odin-container'); // Mount to your container div
    ```

> **For detailed API documentation, advanced configuration, and complete usage examples, please see the [`@exerp/odin-dropin` package README](packages/odin-dropin/README.md).**

## Running the Demo App

The demo app is a simple Vue 3 application that showcases the usage of the `@exerp/odin-dropin` package. It provides an interactive environment for testing and demonstrating the component.

Please refer to the [demo app README](apps/demo/README.md) for instructions on how to run it locally.


## Packages in this Monorepo

This workspace uses [pnpm workspaces](https://pnpm.io/workspaces) and includes the following packages:

*   `packages/odin-dropin` (`@exerp/odin-dropin`): The primary, public-facing facade library. This is the package that host applications should install and import. It provides the `OdinDropin` class for initializing and mounting the component.
*   `packages/core` (`@exerp/odin-dropin-core`): An internal package containing the core Web Component(s) built with Stencil.js (e.g., `<exerp-odin-cc-form>`). This package is consumed by `@exerp/odin-dropin`. Host applications should *not* depend on this directly.
*   **`apps/demo` (`@exerp/odin-dropin-demo`)**: A simple Vue 3 + TypeScript demo application used for local development and testing of the `@exerp/odin-dropin` package. See its [README](apps/demo/README.md) for more details on its purpose.

## Getting Started for Developers (Working in this Repo)

This project is a monorepo built with [Stencil.js](https://stenciljs.com/) (for core web components), [Vite](https://vitejs.dev/) (for the facade library bundling), [TypeScript](https://www.typescriptlang.org/), [Turborepo](https://turbo.build/repo), and [pnpm](https://pnpm.io/).

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


## Local Development with External Projects

If you need to test the `@exerp/odin-dropin` package within another local project (e.g., `webapp-standard`) before publishing, you can use `pnpm add /path/to/local/package` to link it.

For detailed instructions on this workflow, please see [LOCAL_DEVELOPMENT_SETUP.md](LOCAL_DEVELOPMENT_SETUP.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.