import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'exerp-odin-dropin-core',
  outputTargets: [
    {
      type: 'dist', // Main distribution output
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements', // or potentially importing individual components
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    // {
    //   type: 'docs-readme',
    // },
    // {
    //   type: 'www',
    //   serviceWorker: null, // disable service workers
    // },
  ],
  testing: {
    browserHeadless: 'shell',
  },
};
