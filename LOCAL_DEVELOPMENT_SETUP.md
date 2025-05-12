# Local Development Setup: Integrating with External Projects

This guide explains how to link and use the `@exerp/odin-dropin` package from this workspace within another local development project (e.g., `webapp-standard/frontend`) for testing and iteration.

## Prerequisites

1.  **Node.js and pnpm:** Ensure you have Node.js (v18+) and pnpm installed.
2.  **Built Drop-in Package:** You need to have successfully built the `@exerp/odin-dropin` package at least once. Run this from the `odin-dropin-workspace` root:
    ```bash
    pnpm turbo build --filter @exerp/odin-dropin
    ```

## Linking the Drop-in Package Locally

To make your local `@exerp/odin-dropin` available in your other project (let's call it the "host project"), use `pnpm add` with the local path to the package.

1.  **Navigate to your host project's directory:**
    ```bash
    # Example:
    cd /Users/username/dev/exerp/webapp-standard/frontend
    ```

2.  **Add the local drop-in package using its path:**
    It's recommended to use the **absolute path** to the `packages/odin-dropin` directory within your workspace.
    ```bash
    # Replace the path with the actual path on your machine
    pnpm add /Users/username/dev/exerp/odin-dropin-workspace/packages/odin-dropin
    ```

    This command will:
    - Add a dependency like `"@exerp/odin-dropin": "link:/path/to/.../packages/odin-dropin"` to your host project's `package.json`.
    - Create a symlink in your host project's `node_modules/@exerp/odin-dropin` pointing to your local source code (`odin-dropin-workspace/packages/odin-dropin`).

## Basic Usage in Host Project

Once linked, you can import components or functions exported from `@exerp/odin-dropin` just like any other installed package.

**Example (Vue 3 `<script setup>`):**

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
// ⬇️ Import from the linked package
import { OdinDropin } from '@exerp/odin-dropin';
// 📝 Import types if needed
import type { OdinPayErrorPayload } from '@exerp/odin-dropin';

const dropinContainerRef = ref<HTMLElement | null>(null);
let odinDropinInstance: OdinDropin | null = null;

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
      onSubmit: (result) => { console.log('Result from Dropin onSubmit:', result); },
      onError: (error: OdinPayErrorPayload) => { console.error('Error from Dropin onError:', error); }
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
  <!-- 📝 Later, you will mount the actual drop-in component here -->
  <div id="dropin-mount-point" ref="dropinContainerRef"></div>
</template>
```

**Important Note:** Every time you make changes to the source code within `/Users/username/dev/exerp/odin-dropin-workspace/packages/odin-dropin` (or the `core` package it depends on), you **must rebuild** it for the changes to be reflected in your host application:

```bash
# Run this from the odin-dropin-workspace root
pnpm turbo build --filter @exerp/odin-dropin
```

(We will discuss setting up watch modes later to streamline this.)

## Unlinking

If you want to remove the local link and install a published version (once available), first remove the linked dependency:

```bash
# Run from the host project directory (e.g., webapp-standard/frontend)
pnpm remove @exerp/odin-dropin
```

Then you can install normally:

```bash
# Example (after publishing)
# pnpm add @exerp/odin-dropin@latest
```

## Iterating on Changes and Testing

When you make changes to the ODIN Drop-in source code within the `odin-dropin-workspace`, you'll need to rebuild the relevant package(s) to see those changes reflected in your testing environments.

### Testing in an External Host Project (e.g., `webapp-standard`)

This is the primary workflow when using `pnpm add /path/to/package` (local linking) with an external application like `webapp-standard/frontend` that uses `yarn serve` (or a similar Vite/Webpack dev server).

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

**(TODO)**

This section will cover:
- Publishing the `@exerp/odin-dropin` package to a private npm registry (like GitHub Packages or Nexus).
- Versioning strategies.
- How other developers can install and use the published package in their projects.
- CI/CD pipeline considerations for automated building and publishing.