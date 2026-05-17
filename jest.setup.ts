import '@testing-library/jest-dom';

// P11 — jsdom doesn't ship `crypto.randomUUID` by default. Polyfill from
// Node's built-in webcrypto so tests using crypto.randomUUID work.
import { webcrypto } from 'node:crypto';
if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.randomUUID !== 'function') {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}
