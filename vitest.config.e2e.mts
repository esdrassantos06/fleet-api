import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config.mts';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['test/**/*.e2e-spec.ts'],
      fileParallelism: false,
      testTimeout: 15000,
    },
  }),
);
