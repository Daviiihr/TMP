import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'node_modules/',
        '.next/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/app/**/*.tsx',
        'src/components/**/*.tsx',
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/app/**/page.tsx',
        'src/app/api/**/*.ts'
      ]
    },
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
