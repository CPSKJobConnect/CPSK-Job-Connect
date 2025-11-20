import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for libraries like next-auth/jose
// Use Object.defineProperty to avoid direct assignment to the global object
if (typeof globalThis !== "undefined") {
  if (!('TextEncoder' in globalThis)) {
    Object.defineProperty(globalThis, 'TextEncoder', {
      value: TextEncoder as unknown as typeof globalThis.TextEncoder,
      configurable: true,
      writable: true,
    });
  }

  if (!('TextDecoder' in globalThis)) {
    Object.defineProperty(globalThis, 'TextDecoder', {
      value: TextDecoder as unknown as typeof globalThis.TextDecoder,
      configurable: true,
      writable: true,
    });
  }
}
