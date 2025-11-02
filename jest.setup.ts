import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for libraries like next-auth/jose
if (!global.TextEncoder) global.TextEncoder = TextEncoder as any;
if (!global.TextDecoder) global.TextDecoder = TextDecoder as any;
