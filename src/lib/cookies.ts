export type SameSite = 'Lax' | 'Strict' | 'None';

export interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: SameSite;
}

/**
 * Build a Set-Cookie header value ensuring the combined cookie name+value
 * byte length (UTF-8) does not exceed 4096 bytes. Throws an Error when
 * the combined length is too large.
 */
export function buildSetCookieHeader(cookieName: string, cookieValue: string, opts: CookieOptions = {}): string {
  if (!cookieName || typeof cookieName !== 'string') throw new TypeError('Cookie name must be a non-empty string');
  if (typeof cookieValue !== 'string') cookieValue = String(cookieValue ?? '');

  // Per requirement: combined name + value length (in bytes) must be <= 4096
  const combinedBytes = Buffer.byteLength(cookieName + cookieValue, 'utf8');
  if (combinedBytes > 4096) {
    throw new Error(`Cookie too large: name+value is ${combinedBytes} bytes (max 4096)`);
  }

  const {
    path = '/',
    domain,
    maxAge,
    expires,
    // sensible defaults: httpOnly true, secure true in production, sameSite Lax
    httpOnly = true,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'Lax',
  } = opts;

  let header = `${cookieName}=${cookieValue}`;

  if (maxAge !== undefined) header += `; Max-Age=${Math.floor(Number(maxAge))}`;
  if (expires instanceof Date) header += `; Expires=${expires.toUTCString()}`;
  if (path) header += `; Path=${path}`;
  if (domain) header += `; Domain=${domain}`;
  if (secure) header += `; Secure`;
  if (httpOnly) header += `; HttpOnly`;
  if (sameSite) header += `; SameSite=${sameSite}`;

  return header;
}

/**
 * Example helper for using the header with Next.js `NextResponse`:
 *
 * import { NextResponse } from 'next/server';
 * const res = NextResponse.next();
 * res.headers.append('Set-Cookie', buildSetCookieHeader(...));
 */

export default buildSetCookieHeader;

/**
 * Set a cookie safely on a Node/Next response-like object.
 *
 * - Validates combined byte length of `name + value` is <= 4096 bytes.
 * - Works with `res.setHeader('Set-Cookie', ...)` (Node/Next API routes) and
 *   with `res.headers.append('Set-Cookie', ...)` (NextResponse-like) by
 *   detecting available methods.
 *
 * Usage (API route):
 *   setCookieSafe(res, 'sid', jwt, { httpOnly: true, secure: true });
 *
 * Usage (NextResponse):
 *   setCookieSafe(res, 'sid', jwt, { httpOnly: true });
 */
export function setCookieSafe(res: any, cookieName: string, cookieValue: string, opts: CookieOptions = {}) {
  // build header value (this enforces byte-length)
  const headerValue = buildSetCookieHeader(cookieName, cookieValue, opts);

  // Prefer express/Node style res.setHeader
  try {
    if (res && typeof res.setHeader === 'function') {
      // If multiple Set-Cookie headers expected, handle arrays
      const existing = res.getHeader && res.getHeader('Set-Cookie');
      if (!existing) {
        res.setHeader('Set-Cookie', headerValue);
      } else if (Array.isArray(existing)) {
        res.setHeader('Set-Cookie', [...existing, headerValue]);
      } else {
        res.setHeader('Set-Cookie', [existing, headerValue]);
      }
      return;
    }

    // NextResponse-like: headers.append or headers.set
    if (res && res.headers) {
      const headers = res.headers;
      if (typeof headers.append === 'function') {
        headers.append('Set-Cookie', headerValue);
        return;
      }
      if (typeof headers.set === 'function') {
        // some runtimes only provide set; preserve previous by reading first
        const prev = headers.get && headers.get('Set-Cookie');
        if (!prev) {
          headers.set('Set-Cookie', headerValue);
        } else if (Array.isArray(prev)) {
          // unlikely in NextResponse.get, but keep safe
          headers.set('Set-Cookie', [...prev, headerValue] as any);
        } else {
          headers.set('Set-Cookie', `${prev}\n${headerValue}`);
        }
        return;
      }
    }
  } catch (err) {
    // Fall through to generic fallback
  }

  // Fallback: try to append to a `headers` object or throw if not possible
  if (res && typeof res === 'object') {
    // naive fallback: set property
    if (!res['Set-Cookie']) res['Set-Cookie'] = headerValue;
    else if (Array.isArray(res['Set-Cookie'])) res['Set-Cookie'].push(headerValue);
    else res['Set-Cookie'] = [res['Set-Cookie'], headerValue];
    return;
  }

  throw new TypeError('Unable to set cookie on provided `res` object');
}
