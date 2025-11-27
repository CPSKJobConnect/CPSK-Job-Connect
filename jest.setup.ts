import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';
import dotenv from 'dotenv';

// Load environment variables from .env file for testing
dotenv.config();

process.env.CSRF_GUARD_DISABLED = '1';

// DOMPurify relies on ESM-only parse5; mock to avoid transform issues in Jest
jest.mock('isomorphic-dompurify', () => {
  const sanitize = (value: any) => value;
  const create = () => ({ sanitize });
  (create as any).sanitize = sanitize;
  return { __esModule: true, default: create };
});

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
