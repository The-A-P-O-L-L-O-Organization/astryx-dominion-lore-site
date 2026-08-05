import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/coverage/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['app/api/**/*.ts', 'hooks/**/*.ts', 'lib/**/*.ts'],
      exclude: ['lib/db/migrate.ts', 'lib/db/schema-ddl.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
