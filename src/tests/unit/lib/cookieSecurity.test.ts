import enforceCookieSecurity from '@/lib/cookieSecurity';
import { expect } from '@jest/globals';

describe('enforceCookieSecurity', () => {
  it('adds Secure attribute and preserves cookie name when no __Host- present', () => {
    const rawCookie = 'sid=abc123; Path=/; HttpOnly';
    const headers = new Headers();
    headers.append('set-cookie', rawCookie);
    const res = new Response(null, { status: 200, headers });

    const enforced = enforceCookieSecurity(res as Response);
    const entries = Array.from((enforced.headers as any).entries()) as [string, string][];
    const sc = entries.filter(([k]) => String(k).toLowerCase() === 'set-cookie').map(([, v]) => String(v));

    expect(sc.length).toBeGreaterThan(0);
    const out = String(sc[0]);
    expect(out).toMatch(/(^|;\s*)Secure(\b|$)/i);
    // Name should be preserved (no automatic prefixing)
    expect(out.startsWith('sid=')).toBe(true);
  });

  it('does not add __Secure- when cookie already uses __Host- prefix, but ensures Secure attribute', () => {
    const rawCookie = '__Host-session=xyz; Path=/; HttpOnly';
    const headers = new Headers();
    headers.append('set-cookie', rawCookie);
    const res = new Response(null, { status: 200, headers });

    const enforced = enforceCookieSecurity(res as Response);
    const entries = Array.from((enforced.headers as any).entries()) as [string, string][];
    const sc = entries.filter(([k]) => String(k).toLowerCase() === 'set-cookie').map(([, v]) => String(v));

    expect(sc.length).toBeGreaterThan(0);
    const out = String(sc[0]);
    expect(out.startsWith('__Host-session=')).toBe(true);
    expect(out).toMatch(/(^|;\s*)Secure(\b|$)/i);
  });
});
