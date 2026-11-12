import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.mts';

export default defineConfig({
  ...baseConfig,
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    fileParallelism: false,
    testTimeout: 15000,
  },
});
