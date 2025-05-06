import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OdinDropin', // Global variable name for UMD build
      formats: ['es', 'umd', 'cjs'], // Generate ESM, UMD, and CJS formats
      fileName: (format) => `odin-dropin.${format}.js`,
    },
    sourcemap: true, // Generate source maps for debugging
    // Rollup options can be added here if needed later (e.g., for externals)
    // rollupOptions: {
    //   // make sure to externalize deps that shouldn't be bundled
    //   // into your library (e.g., peer dependencies)
    //   external: [], // We might need to externalize '@exerp/odin-dropin-core' later
    //   output: {
    //     // Provide global variables to use in the UMD build
    //     // for externalized deps
    //     globals: {},
    //   },
    // },
  },
  plugins: [
    dts({ // Plugin to generate TypeScript declaration files (.d.ts)
      tsconfigPath: './tsconfig.json', // Ensure this points to your tsconfig
      outDir: 'dist/types', // Output directory for declaration files
    }),
  ],
});