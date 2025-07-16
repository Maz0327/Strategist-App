import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./client/src/test-setup.ts'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'client/src/test-setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'build/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@assets': resolve(__dirname, './attached_assets'),
    },
  },
});