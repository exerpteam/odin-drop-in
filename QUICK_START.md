# Quick Start Guide - ODIN Drop-in Workspace

This guide provides the essential commands for working with this monorepo. Run these commands from the root directory (`odin-dropin-workspace`).

## 1. Installation

First, ensure you have [Node.js](https://nodejs.org/) (version 18 or higher recommended) and [pnpm](https://pnpm.io/installation) installed.

Then, install all project dependencies using pnpm:

```bash
pnpm install
```

This command installs dependencies for all packages within the workspace (`@exerp/odin-dropin-core`, `@exerp/odin-dropin`, etc.).

## 2. Build

To build all packages (`core` components and the `odin-dropin` facade library) for production, run:

```bash
pnpm turbo build
```

This uses Turborepo to efficiently build the packages in the correct order. Build artifacts will typically be placed in the `dist` folder within each package (`packages/core/dist`, `packages/odin-dropin/dist`).

## 3. Development (Local Demo)

*(Instructions to be added once the demo application is set up)*

## 4. Testing

*(Instructions to be added once tests are configured)*

## 5. Cleaning Build Artifacts

To remove all `dist`, `.turbo`, and `node_modules` folders:

```bash
pnpm turbo clean # (We need to define this task in turbo.json)
rm -rf node_modules
```

*(Note: We will add the `clean` task definition to `turbo.json` later)*