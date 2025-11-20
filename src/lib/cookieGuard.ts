import type { IncomingMessage, ServerResponse } from 'http';

const MAX_BYTES = 4096;

function toArray(header: any): string[] {
  if (!header) return [];
  if (Array.isArray(header)) return header.map(String);
  return [String(header)];
}

function parseNameValue(cookieHeader: string): { cookieName: string; cookieValue: string } | null {
  // cookieHeader expected like: name=value; Path=/; HttpOnly
  const pair = cookieHeader.split(';')[0] || '';
  const eq = pair.indexOf('=');
  if (eq <= 0) return null;
  const cookieName = pair.slice(0, eq).trim();
  const cookieValue = pair.slice(eq + 1).trim();
  return { cookieName, cookieValue };
}

export function validateSetCookieHeaders(header: any) {
  const arr = toArray(header);
  const violations: Array<{ index: number; header: string; cookieName?: string; cookieValue?: string; bytes?: number }> = [];
  for (let i = 0; i < arr.length; i++) {
    const h = arr[i];
    const nv = parseNameValue(h);
    if (!nv) {
      // treat as unknown; skip (could be dynamic) — do not mark as pass
      violations.push({ index: i, header: h });
      continue;
    }
    const bytes = Buffer.byteLength(nv.cookieName + nv.cookieValue, 'utf8');
    if (bytes > MAX_BYTES) {
      violations.push({ index: i, header: h, cookieName: nv.cookieName, cookieValue: nv.cookieValue, bytes });
    }
  }
  return violations;
}

/**
 * Wrap a Node/Next.js API handler to enforce cookie size rule.
 * Usage:
 *   export default withCookieSizeGuard(async function handler(req, res) { ... });
 *
 * Behavior: runs the handler, then inspects `res.getHeader('Set-Cookie')` or
 * `res.getHeader && res.getHeader('set-cookie')` and throws an Error listing
 * violations if any are found. This will cause the request to fail early in
 * CI or tests and prevents sending oversized cookies at runtime.
 */
export function withCookieSizeGuard(handler: (req: IncomingMessage, res: ServerResponse) => Promise<any> | any) {
  return async function guarded(req: IncomingMessage, res: ServerResponse) {
    const result = await handler(req, res);

    // Node's header keys may vary in casing; try both
    const header = (res && typeof (res as any).getHeader === 'function') ? (res as any).getHeader('Set-Cookie') || (res as any).getHeader('set-cookie') : undefined;

    const violations = validateSetCookieHeaders(header);
    if (violations.length > 0) {
      const msgs = violations.map(v => {
        if (v.bytes) return `cookie[${v.index}]: name=${v.cookieName} bytes=${v.bytes}`;
        return `cookie[${v.index}]: unable to parse header (${String(v.header).slice(0,80)})`;
      });
      const err = new Error(`Cookie size violations: ${msgs.join('; ')}`);
      // Throwing will cause the request to error (500) so the issue surfaces.
      throw err;
    }

    return result;
  };
}

export default withCookieSizeGuard;

/**
 * App Router / Fetch Response wrapper variant.
 * Accepts a handler that returns a `Response` (or Promise<Response>), inspects
 * the `set-cookie` headers on the returned Response, and throws an Error
 * (or returns a 500 Response) if violations are found. Use this to wrap
 * handlers like NextAuth's App Router handler which return a Response.
 */
export function withResponseCookieSizeGuard(handler: (...args: any[]) => Promise<any> | any) {
  return async function guarded(...args: any[]) {
    // Some handlers (e.g., NextAuth) may expect `req.query` to exist and
    // destructure route params from it. The platform `Request` may not have
    // `query`; create a Proxy to provide an empty object when missing so
    // destructuring doesn't throw.
    const req = args[0];
    let safeReq = req;
    if (req && typeof req === 'object') {
      safeReq = new Proxy(req, {
        get(target, prop, receiver) {
          if (prop === 'query') return (target as any).query || {};
          return Reflect.get(target as any, prop, receiver as any);
        }
      });
    }

    const res = await handler(safeReq, ...args.slice(1));

    // Inspect Set-Cookie headers (may be multiple). `Headers` may not expose
    // `getAll`; iterate entries and collect all `set-cookie` values.
    const headerArr: string[] = [];
    if (res && res.headers && typeof (res.headers as any).entries === 'function') {
      const entries = Array.from((res.headers as any).entries());
      for (const entry of entries) {
        const [k, v] = entry as any;
        if (String(k).toLowerCase() === 'set-cookie' && v) headerArr.push(String(v));
      }
    }
    const header = headerArr;

    const violations = validateSetCookieHeaders(header);
    if (violations.length > 0) {
      const msgs = violations.map(v => v.bytes ? `cookie[${v.index}]: name=${v.cookieName} bytes=${v.bytes}` : `cookie[${v.index}]: unable to parse header`);
      throw new Error(`Cookie size violations: ${msgs.join('; ')}`);
    }

    return res;
  };
}
