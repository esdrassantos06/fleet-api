import { fileURLToPath } from 'node:url';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
  },
  resolve: {
    alias: { src: fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
