# Local Development Setup: Integrating with External Projects

This guide explains how to link and use the `@exerp/odin-dropin` package from this workspace within another local development project (e.g., `webapp-standard/frontend`) for testing and iteration.

## Prerequisites

1.  **Node.js and pnpm:** Ensure you have Node.js (v18+) and pnpm installed.
2.  **Built Drop-in Package:** You need to have successfully built the `@exerp/odin-dropin` package at least once. Run this from the `odin-dropin-workspace` root:
    ```bash
    pnpm turbo build --filter @exerp/odin-dropin
    ```

## Linking the Drop-in Package Locally

To make your local `@exerp/odin-dropin` available in your other project (let's call it the "host project"), you'll need to add it using the host project's package manager with a local path.

> **Important:** Use the same package manager that your host project uses. For example, `webapp-standard/frontend` uses **yarn**, so you must use yarn commands there (not pnpm).

1.  **Navigate to your host project's directory:**
    ```bash
    # Example:
    cd /Users/username/dev/exerp/webapp-standard/frontend
    ```

2.  **Add the local drop-in package using its path:**
    It's recommended to use the **absolute path** to the `packages/odin-dropin` directory within your workspace.

    **For yarn projects** (e.g., `webapp-standard/frontend`):
    ```bash
    # Replace the path with the actual path on your machine
    yarn add link:/Users/username/dev/exerp/odin-dropin-workspace/packages/odin-dropin
    ```

    **For pnpm projects:**
    ```bash
    # Replace the path with the actual path on your machine
    pnpm add /Users/username/dev/exerp/odin-dropin-workspace/packages/odin-dropin
    ```

    **For npm projects:**
    ```bash
    # Replace the path with the actual path on your machine
    npm install /Users/username/dev/exerp/odin-dropin-workspace/packages/odin-dropin
    ```

    This command will:
    - Add a dependency like `"@exerp/odin-dropin": "link:/path/to/.../packages/odin-dropin"` to your host project's `package.json`.
    - Create a symlink in your host project's `node_modules/@exerp/odin-dropin` pointing to your local source code (`odin-dropin-workspace/packages/odin-dropin`).

## Basic Usage in Host Project

Once linked, you can import components or functions exported from `@exerp/odin-dropin` just like any other installed package.

**Example (Vue 3 `<script setup>`):**

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
// ⬇️ Import from the linked package, including new types
import {
  OdinDropin,
  type OdinPayErrorPayload,
  type OdinSubmitPayload, // For onSubmit type
  type OdinFieldValidationEvent, // For onChangeValidation
  type OdinV2ThemeConfig    // For theme
} from '@exerp/odin-dropin';

const dropinContainerRef = ref<HTMLElement | null>(null);
let odinDropinInstance: OdinDropin | null = null;

// Example onChangeValidation handler
const handleFieldValidation = (event: OdinFieldValidationEvent) => {
  console.log('[Host App] onChangeValidation:', event.fieldName, 'isValid:', event.isValid, 'errorCode:', event.errorCode);
};

// Example theme
const exampleTheme: OdinV2ThemeConfig = {
  fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  fontSize: '15px',
  color: '#333',
  '::placeholder': {
    color: '#999'
  }
};

onMounted(() => {
  console.log('Host component mounted.');
  try {
    // ⬇️ Simulate fetching token and getting country
    const odinPublicToken = 'YOUR_TEST_TOKEN'; // Replace with actual token
    const countryCode = 'US'; // Replace with 'CA' or dynamic value
    
    if (!dropinContainerRef.value) {
      console.error("Mount point not found!");
      return;
    }

    // ⬇️ Instantiate with mandatory params
    odinDropinInstance = new OdinDropin({
      odinPublicToken: odinPublicToken,
      countryCode: countryCode,
      paymentMethodType: 'CARD', // Or 'BANK_ACCOUNT'
      // billingFieldsConfig: { name: true }, // Optional: example
      theme: exampleTheme,
      onChangeValidation: handleFieldValidation,
      onSubmit: (result: OdinSubmitPayload) => {
        console.log('Result from Dropin onSubmit:', result);
        // Process result: result.paymentMethodId, result.paymentMethodType, result.details, etc.
      },
      onError: (error: OdinPayErrorPayload) => {
        console.error('Error from Dropin onError:', error);
        // Process error: error.code, error.message, error.fieldErrors
      }
    });

    // ⬇️ Mount the drop-in
    odinDropinInstance.mount(dropinContainerRef.value); // Use the ref's value, or the ID of the mount point
    console.log('OdinDropin mount called.');

  } catch (error) {
    console.error('Failed to initialize or mount OdinDropin:', error);
  }
});
</script>

<template>
  <div>Host Application Component</div>
  <div id="dropin-mount-point" ref="dropinContainerRef" style="max-width: 400px; margin: 20px; padding:15px; border: 1px solid #eee;">
    <!-- Drop-in will mount here. 
         Apply external CSS for borders/container styles as needed.
         Example CSS for .odin-field-container:
         .odin-field-container { border: 1px solid #ccc; border-radius: 4px; padding: 8px; margin-bottom: 10px; }
    -->
  </div>
</template>
```

**Important Note:** Every time you make changes to the source code within `/Users/username/dev/exerp/odin-dropin-workspace/packages/odin-dropin` (or the `core` package it depends on), you **must rebuild** it for the changes to be reflected in your host application:

```bash
# Run this from the odin-dropin-workspace root
pnpm turbo build --filter @exerp/odin-dropin
```

(We will discuss setting up watch modes later to streamline this.)

## Unlinking

If you want to remove the local link and install a published version, first remove the linked dependency using your host project's package manager:

**For yarn projects:**
```bash
# Run from the host project directory (e.g., webapp-standard/frontend)
yarn remove @exerp/odin-dropin
yarn add @exerp/odin-dropin@latest
```

**For pnpm projects:**
```bash
pnpm remove @exerp/odin-dropin
pnpm add @exerp/odin-dropin@latest
```

**For npm projects:**
```bash
npm uninstall @exerp/odin-dropin
npm install @exerp/odin-dropin@latest
```

## Iterating on Changes and Testing

When you make changes to the ODIN Drop-in source code within the `odin-dropin-workspace`, you'll need to rebuild the relevant package(s) to see those changes reflected in your testing environments.

### Testing in an External Host Project (e.g., `webapp-standard`)

This is the primary workflow when using local linking with an external application like `webapp-standard/frontend`.

> **Note:** The `webapp-standard/frontend` project uses **yarn** as its package manager. Use `yarn add link:/path/to/package` to link the local drop-in package (see [Linking the Drop-in Package Locally](#linking-the-drop-in-package-locally) above).

1.  **Make Code Changes:**
    *   Modify files in `odin-dropin-workspace/packages/core/src/...` for the Stencil web components.
    *   Or, modify files in `odin-dropin-workspace/packages/odin-dropin/src/...` for the facade logic.

2.  **Rebuild the Drop-in Package:**
    *   In your terminal, navigate to the root of the `odin-dropin-workspace`.
    *   Run the build command:
        ```bash
        pnpm turbo build --filter @exerp/odin-dropin
        ```
    *   This command ensures that `@exerp/odin-dropin-core` (if changed and it's a dependency of the facade) and the `@exerp/odin-dropin` facade package are rebuilt. The updated `dist` folder in `packages/odin-dropin` will contain the latest changes.

3.  **Refresh/Check the Host Application (`webapp-standard`):**
    *   Your host application (`webapp-standard/frontend`), which you run with `yarn serve`, is symlinked to the `dist` output of your local `@exerp/odin-dropin` package.
    *   The Vue CLI dev server (webpack) usually watches for changes in `node_modules` (including symlinked packages) and should automatically trigger a hot module replacement (HMR) or a full page reload.
    *   If the browser doesn't update automatically, manually refresh the page in your browser where `webapp-standard` is running.

4.  **Troubleshooting (If Changes Don't Appear in Host Application):**
    *   **Hard Refresh:** Try a hard refresh in your browser (e.g., Ctrl+Shift+R or Cmd+Shift+R).
    *   **Restart Host Dev Server:** Stop (`Ctrl+C`) and restart the `yarn serve` command in your `webapp-standard/frontend` project. Dev servers can sometimes be inconsistent with picking up updates from symlinked dependencies immediately.
    *   **Verify Build Output:** Double-check the contents and timestamps of files in the `dist` folder within `odin-dropin-workspace/packages/odin-dropin` to ensure the build artifacts were indeed updated.
    *   **Check Symlink:** Confirm that the symlink in `webapp-standard/frontend/node_modules/@exerp/odin-dropin` correctly points to your local `odin-dropin-workspace/packages/odin-dropin` directory.
    *   **Cache:** In rare cases, aggressive caching by the browser or build tools might interfere. Clearing the browser cache or any build tool cache in the host project (e.g., `rm -rf node_modules/.cache` if webpack creates one) could be a last resort.

### Testing Changes within the Monorepo

You can also test changes more directly within the `odin-dropin-workspace`:

*   **Testing with the Demo Application (`apps/demo`):**
    1.  Make your changes in `packages/core/src/...` or `packages/odin-dropin/src/...`.
    2.  Rebuild the facade: `pnpm turbo build --filter @exerp/odin-dropin`. (This ensures both `core` and `odin-dropin` are up-to-date).
    3.  If the demo app is already running (via `pnpm dev --filter @exerp/odin-dropin-demo` from the workspace root), Vite's HMR should pick up the changes from the rebuilt workspace package. If not, a browser refresh or restarting the demo app's dev server might be needed.
    4.  Refer to `QUICK_START.md` for instructions on running the demo app.

*   **Testing Core Components in Isolation:**
    1.  Make changes directly in `packages/core/src/...`.
    2.  Run the Stencil development server from within the `packages/core` directory:
        ```bash
        cd packages/core
        pnpm start
        ```
    3.  This will serve `packages/core/src/index.html` (usually at `http://localhost:3333`) and provide HMR for the Stencil components.
    4.  Refer to `QUICK_START.md` for more details on isolated core component development.

(Future consideration: We can explore setting up watch modes with Turborepo to automatically rebuild packages on changes, which could further streamline this workflow.)

## Publishing / Deployment

This section outlines the steps to publish the `@exerp/odin-dropin` package to the npm registry under the `@exerp` scope. Our repository is hosted at `https://github.com/exerpteam/odin-drop-in`.

### Prerequisites

1.  **npm Account:** You must have an npm account.
2.  **Organization Membership & Permissions:** You need to be a member of the `@exerp` organization on npmjs.com and have permissions to publish packages to that scope.
3.  **Logged into npm:** You must be logged into npm via the CLI. If not, run:
    ```bash
    pnpm login
    ```
    Follow the prompts. This will authenticate you with the default npm registry (`https://registry.npmjs.org/`).

### Versioning the Package

Before publishing a new version, it's crucial to update the `version` field in `packages/odin-dropin/package.json` according to [Semantic Versioning (SemVer)](https://semver.org/) and to tag this version in Git.

**Recommended Approach (using pnpm):**

Ideally, pnpm's version command can handle this. Run from the workspace root:

```bash
# Examples:
# pnpm --filter @exerp/odin-dropin version patch
# pnpm --filter @exerp/odin-dropin version minor
# pnpm --filter @exerp/odin-dropin version major
# pnpm --filter @exerp/odin-dropin version <specific_version>

# This command *should* ideally:
# 1. Update the version in `packages/odin-dropin/package.json`.
# 2. Create a Git commit for the version change.
# 3. Create a Git tag for the version.
# Ensure you have no uncommitted changes before running this.
```
⚠️ **Note:** *In some environments or pnpm versions, this command might update the `package.json` but not automatically create the Git commit and tag. Always verify the outcome.*

**Manual Fallback (Reliable Method):**

If the `pnpm version` command doesn't create the Git commit and tag, or if you prefer manual control, follow these steps:

1.  **Manually Edit `packages/odin-dropin/package.json`:**
    *   Open the file and update the `version` field to the new desired version (e.g., `1.0.1`).

2.  **Commit the Version Change:**
    ```bash
    # Stage the package.json change
    git add packages/odin-dropin/package.json
    # Commit with a descriptive message
    git commit -m "release: @exerp/odin-dropin v1.0.1" 
    # (Adjust version and message as needed)
    ```

3.  **Tag the Commit:**
    Create a Git tag for the new version. It's good practice to use a format like `v<version>` or `<packagename>@v<version>`.
    ```bash
    # Example:
    git tag v1.0.1 
    # (Ensure this matches the version in package.json)
    ```

4.  **Push Commits and Tags:**
    After committing and tagging, push them to the remote repository:
    ```bash
    git push
    git push --tags # Or push the specific tag: git push origin v1.0.1
    ```

Always ensure your `package.json` version, Git commit, and Git tag are consistent before proceeding to build and publish.

### Building the Package

Ensure the package has been built with the latest changes:

```bash
# Run from the workspace root
pnpm turbo build --filter @exerp/odin-dropin
```
This command will build only the `@exerp/odin-dropin` package and its dependencies (like `@exerp/odin-dropin-core` if it changed).

### Publishing to npm

Once versioned and built, you can publish the package:

```bash
# Run from the workspace root
pnpm publish --filter @exerp/odin-dropin
```
This command tells pnpm to publish the package located by the filter. Pnpm will use the version from `packages/odin-dropin/package.json`.

### Post-Publishing Steps

1.  **Push Git Commits and Tags:**
    If you used `pnpm version` or manually created commits/tags, push them to the remote repository:
    ```bash
    git push
    git push --tags
    ```

2.  **Create a Release on GitHub (Recommended):**
    Navigate to `https://github.com/exerpteam/odin-drop-in/releases` and create a new release corresponding to the Git tag. Include release notes detailing the changes.

3.  **Verify on npmjs.com:**
    Check the package page on npm (e.g., `https://www.npmjs.com/package/@exerp/odin-dropin`) to ensure the new version is listed correctly.
