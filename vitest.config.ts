import { defineConfig } from 'vitest/config';
import { transformSync } from 'esbuild';

export default defineConfig({
  plugins: [
    {
      name: 'ts-decorators-transform',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('.ts') && !id.includes('node_modules')) {
          const result = transformSync(code, {
            loader: 'ts',
            target: 'es2020',
            sourcefile: id,
            sourcemap: true,
            tsconfigRaw: {
              compilerOptions: {
                experimentalDecorators: true,
                emitDecoratorMetadata: true,
              },
            },
          });
          return {
            code: result.code,
            map: result.map ? JSON.parse(result.map) : undefined,
          };
        }
      },
    },
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'examples/',
        '**/*.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '../src/index.js': '../src/index.ts',
    }
  }
});
