/**
 * @file jest.config.ts
 * @description Jest configuration for the Next.js UI using next/jest, jsdom environment, jest-dom setup and @/* path aliases.
 * @author Carlos Mejía
 * @project MIPIT-PoC — Cross-border Instant Payments Middleware
 */

import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const customConfig: Config = {
  testEnvironment: 'jsdom',
  // P11 — `setupFilesAfterEach` was the wrong key (`setupFiles`). jest-dom
  // matchers need the test framework globals already loaded.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
  ],
};

export default createJestConfig(customConfig);
