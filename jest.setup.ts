import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';


process.env.CSRF_GUARD_DISABLED = '1';


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
