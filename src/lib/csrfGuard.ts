/**
 * CSRF guard helpers.
 *
 * Strategy: for state-changing requests (POST/PUT/PATCH/DELETE) require an
 * additional non-CORS-safelisted header `x-app-request: 1` OR an
 * `Authorization: Bearer <token>` header. Browsers will not send
 * non-simple headers cross-origin without a preflight, so this defends
 * against CSRF when the application controls its own XHR/fetch clients.
 */

export const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isSafeMethod(method?: string | null) {
  if (!method) return false;
  return SAFE_METHODS.has(String(method).toUpperCase());
}

export function isStateChanging(method?: string | null) {
  if (!method) return false;
  return !isSafeMethod(method);
}

function headerEquals(val: any, expected: string) {
  if (!val) return false;
  try { return String(val).toLowerCase() === expected.toLowerCase(); } catch { return false; }
}

export function isAuthorizedRequest(req: any) {
  const auth = req?.headers?.get ? req.headers.get('authorization') : req?.headers?.authorization || req?.headers?.Authorization;
  return Boolean(auth && String(auth).toLowerCase().startsWith('bearer '));
}

export function isAppRequest(req: any) {
  const appHeader = req?.headers?.get ? req.headers.get('x-app-request') : req?.headers?.['x-app-request'] || req?.headers?.['X-App-Request'];
  return headerEquals(appHeader, '1') || headerEquals(appHeader, 'true');
}

export function validateCsrfForRequestLike(req: any) {
  // Allow an explicit opt-out when running in special test modes.
  // Use `CSRF_GUARD_DISABLED=1` to bypass CSRF validation (useful for
  // integration/unit tests that invoke handlers directly). We do NOT
  // automatically disable based on NODE_ENV so that unit tests which
  // assert the guard's behavior can still run with the guard enabled.
  if (process.env.CSRF_GUARD_DISABLED === '1') {
    return { ok: true };
  }

  // Validate CSRF for state-changing requests. Follow OWASP ASVS 3.5.1:
  // require an additional non-CORS-safelisted header (e.g. `x-app-request`)
  // or an Authorization Bearer token for API clients.
  // If method is safe, accept
  const method = req?.method || (req?.nextUrl ? req.nextUrl.method : undefined) || 'GET';
  if (!isStateChanging(method)) return { ok: true };

  if (isAuthorizedRequest(req)) return { ok: true };
  if (isAppRequest(req)) return { ok: true };

  return { ok: false, reason: 'missing CSRF header or authorization' };
}

export function withCsrfGuard(handler: (req: any, res: any) => Promise<any> | any) {
  return async function guarded(req: any, res: any) {
    const check = validateCsrfForRequestLike(req);
    if (!check.ok) {
      if (res && typeof res.status === 'function') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (res && typeof res.writeHead === 'function') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Forbidden' }));
        return;
      }
      throw new Error('Forbidden: CSRF validation failed');
    }
    return handler(req, res);
  };
}

export function withResponseCsrfGuard(handler: (...args: any[]) => Promise<Response> | Response) {
  return async function guarded(...args: any[]) {
    const req = args[0];
    const check = validateCsrfForRequestLike(req);
    if (!check.ok) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    return handler(...args);
  };
}

export default withCsrfGuard;
