import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'exerp-odin-dropin-core',
  outputTargets: [
    {
      type: 'dist', // Main distribution output
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      type: 'www',
      // Tell the dev server to use src/index.html as the entry point
      indexHtml: 'index.html',
      // Tell Stencil where the source assets (like index.html) are
      dir: 'www', // This will be the output dir *if* you run `stencil build` without --dev
      // For dev server, we can point to src assets directly.
      // This might be implicitly handled when --serve is used, but let's be safe.
      // If the above doesn't work, we might need copy assets config, but let's keep it simple first.
      serviceWorker: null, // Keep service worker disabled
    },
  ],
  testing: {
    browserHeadless: 'shell',
  },
  // 🧑‍💻 Optional: Explicit devServer config (try without this first)
  // devServer: {
  //   root: 'src', // Specify the root directory for the dev server
  //   openBrowser: false // Prevent opening a new tab automatically
  // }
};
