import { withCookieSizeGuard, validateSetCookieHeaders } from '@/lib/cookieGuard';

// Simple mock response that collects headers
function createMockRes() {
  const headers: Record<string, any> = {};
  return {
    _headers: headers,
    setHeader(name: string, value: any) {
      headers[name] = value;
    },
    getHeader(name: string) {
      return headers[name];
    }
  } as any;
}

describe('cookieGuard', () => {
  test('validateSetCookieHeaders returns violation for large literal', () => {
    const name = 'a';
    const value = 'x'.repeat(4096); // name + value = 4097 bytes
    const header = `${name}=${value}; Path=/; HttpOnly`;
    const v = validateSetCookieHeaders([header]);
    if (v.length === 0) throw new Error('expected at least one violation');
    if (!v[0].bytes || v[0].bytes <= 4096) throw new Error('expected bytes > 4096');
  });

  test('withCookieSizeGuard throws when handler sets oversized cookie', async () => {
    const res = createMockRes();
    const req = {} as any;
    const handler = async (req: any, res: any) => {
      const name = 'a';
      const value = 'x'.repeat(4096);
      res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly`);
      return { ok: true };
    };

    const wrapped = withCookieSizeGuard(handler);
    try {
      await wrapped(req, res);
      throw new Error('expected wrapped handler to throw due to cookie size violation');
    } catch (err: any) {
      if (!/Cookie size violations/.test(String(err))) throw err;
    }
  });

  test('withCookieSizeGuard passes when cookie size is within limit', async () => {
    const res = createMockRes();
    const req = {} as any;
    const handler = async (req: any, res: any) => {
      res.setHeader('Set-Cookie', `sid=small; Path=/; HttpOnly`);
      return { ok: true };
    };
    const wrapped = withCookieSizeGuard(handler);
    const out = await wrapped(req, res);
    if (JSON.stringify(out) !== JSON.stringify({ ok: true })) throw new Error('unexpected result from wrapped handler');
  });
});
