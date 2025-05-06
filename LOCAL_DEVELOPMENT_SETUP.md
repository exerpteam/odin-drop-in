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
    cd /Users/majidlaissi/dev/exerp/webapp-standard/frontend
    ```

2.  **Add the local drop-in package using its path:**
    It's recommended to use the **absolute path** to the `packages/odin-dropin` directory within your workspace.
    ```bash
    # Replace the path with the actual path on your machine
    pnpm add /Users/majidlaissi/dev/exerp/odin-dropin-workspace/packages/odin-dropin
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
import { initializeOdinDropin } from '@exerp/odin-dropin';

onMounted(() => {
  console.log('Host component mounted.');
  try {
    // ⬇️ Call the function from the drop-in
    const result = initializeOdinDropin();
    console.log('Result from initializeOdinDropin:', result);
  } catch (error) {
    console.error('Failed to call initializeOdinDropin:', error);
  }
});
</script>

<template>
  <div>Host Application Component</div>
  <!-- 📝 Later, you will mount the actual drop-in component here -->
  <div id="dropin-mount-point"></div>
</template>
```

**Important Note:** Every time you make changes to the source code within `/Users/majidlaissi/dev/exerp/odin-dropin-workspace/packages/odin-dropin` (or the `core` package it depends on), you **must rebuild** it for the changes to be reflected in your host application:

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

## Publishing / Deployment

**(TODO)**

This section will cover:
- Publishing the `@exerp/odin-dropin` package to a private npm registry (like GitHub Packages or Nexus).
- Versioning strategies.
- How other developers can install and use the published package in their projects.
- CI/CD pipeline considerations for automated building and publishing.