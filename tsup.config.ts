import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // Main library entry
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    target: 'node18',
    platform: 'node',
    dts: true,
    sourcemap: true,
    clean: false,
    splitting: false,
    bundle: true,
    minify: false,
    outDir: 'dist',
    external: [
      'express',
      'swagger-ui-express',
      'reflect-metadata'
    ]
  },
  {
    // CLI entry — bundled as a single self-contained script that the
    // bin/cli.js shim can require().
    entry: ['src/cli/index.ts'],
    format: ['esm', 'cjs'],
    target: 'node18',
    platform: 'node',
    dts: false,
    sourcemap: true,
    clean: false,
    splitting: false,
    bundle: true,
    minify: false,
    outDir: 'dist/cli',
    external: [
      'express',
      'swagger-ui-express',
      'reflect-metadata',
      'cac',
      'fast-glob',
      'yaml',
      'tsx',
      'tsx/esm/api'
    ]
  }
]);
