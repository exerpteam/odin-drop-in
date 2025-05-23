# Quick Start Guide - ODIN Drop-in Workspace

This guide provides the essential commands for working with this monorepo. Run these commands from the root directory (`odin-dropin-workspace`).

## 1. Installation

First, ensure you have [Node.js](https://nodejs.org/) (version 18 or higher recommended) and [pnpm](https://pnpm.io/installation) installed.

Then, install all project dependencies using pnpm:

```bash
pnpm install
```

This command installs dependencies for all packages within the workspace (`@exerp/odin-dropin-core`, `@exerp/odin-dropin`, `@exerp/odin-dropin-demo`, etc.).

## 2. Build

To build all packages (`core` components and the `odin-dropin` facade library) for production, run:

```bash
pnpm turbo build
```

This uses Turborepo to efficiently build the packages in the correct order. Build artifacts will typically be placed in the `dist` folder within each package (`packages/core/dist`, `packages/odin-dropin/dist`). The demo app also has a build command, but it's typically used for deployment previews rather than library development.

## 3. Development (Isolated Core Component)

To work on and visually test the core Stencil components (`packages/core`) in isolation, without running the full demo application:

1.  Navigate to the core package directory:
    ```bash
    cd packages/core
    ```
2.  Run the Stencil development server:
    ```bash
    pnpm start
    ```

This will build the component in development mode, start a local server (usually at `http://localhost:3333`), and watch for changes. Open the provided URL in your browser to view the component as rendered by `packages/core/src/index.html`.

## 4. Development (Full Demo App)

To run the local Vue demonstration application (`apps/demo`) which allows you to interactively test the `@exerp/odin-dropin` component:

```bash
# Run this from the root directory
pnpm dev --filter @exerp/odin-dropin-demo
```

This command uses Turborepo to execute the `dev` script defined in `apps/demo/package.json` (which typically runs `vite`). Vite will start a development server and provide a URL (usually `http://localhost:5173` or similar) to open in your browser.

The demo app will hot-reload as you make changes to the `@exerp/odin-dropin` facade or the `@exerp/odin-dropin-core` components (after rebuilding them if necessary - Turborepo's watch mode can help here, but we'll configure that later if needed).

## 5. Testing

Automated tests (unit, integration, e2e) for the ODIN Drop-in components and facade are planned for a future iteration.

Currently, testing relies on:
-   Isolated core component testing using the Stencil development server (see Section 3).
-   Interactive testing of the full drop-in functionality using the Demo Application (see Section 4).
-   Local linking and testing within an external host project (see [LOCAL_DEVELOPMENT_AND_PUBLISHING.md](./docs/LOCAL_DEVELOPMENT_AND_PUBLISHING.md)).

*(Detailed instructions for running automated tests will be added here once they are configured.)*

## 6. Cleaning Build Artifacts

To remove build artifacts (`dist`, `.turbo`, `.stencil`, `loader`) and `node_modules` from all packages, first define the `clean` task in `turbo.json`:

**Add this to `turbo.json` inside the `tasks` object:**

```jsonc
// In turbo.json
"clean": {
  "cache": false
}
```

Then, you can run the following commands from the root directory:

```bash
# Execute the clean script defined in package.jsons (needs to be added)
pnpm turbo clean

# Manually remove root node_modules (Turbo doesn't manage this)
rm -rf node_modules

# Optional: Manually remove node_modules from specific packages if needed (usually not required with pnpm)
# rm -rf packages/core/node_modules
# rm -rf packages/odin-dropin/node_modules
# rm -rf apps/demo/node_modules
```

*(Note: We still need to add a "clean" script to each package's `package.json` that removes its specific build artifacts, e.g., `rm -rf dist .stencil loader`)*