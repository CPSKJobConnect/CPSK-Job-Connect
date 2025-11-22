import { NextRequest } from "next/server";
import { POST as acceptPOST } from "@/app/api/consent/accept/route";
import { GET as statusGET } from "@/app/api/consent/status/route";
import { authOptions } from "@/lib/auth";
import buildSetCookieHeader from '@/lib/cookies';
import { expect } from '@jest/globals';

describe('Consent cookie API', () => {
   test('allows cookie where name+value bytes <= 4096', () => {
      const cookieName = 'testcookie';
      const nameBytes = Buffer.byteLength(cookieName, 'utf8');
      const allowed = 4096 - nameBytes;
      const cookieValue = 'a'.repeat(allowed);
      const header = buildSetCookieHeader(cookieName, cookieValue, { httpOnly: true, secure: false, sameSite: 'Lax' });
      expect(header).toContain(`${cookieName}=`);
    });
  
    test('throws when name+value bytes > 4096', () => {
      const cookieName = 'bigcookie';
      const nameBytes = Buffer.byteLength(cookieName, 'utf8');
      const tooLarge = 4096 - nameBytes + 1;
      const cookieValue = 'b'.repeat(tooLarge);
      expect(() => buildSetCookieHeader(cookieName, cookieValue)).toThrow(/Cookie too large/);
    });
  
    test('includes flags when options provided', () => {
      const header = buildSetCookieHeader('k', 'v', { httpOnly: true, secure: true, sameSite: 'Strict', path: '/app', domain: 'example.com' });
      expect(header).toContain('HttpOnly');
      expect(header).toContain('Secure');
      expect(header).toContain('SameSite=Strict');
      expect(header).toContain('Path=/app');
      expect(header).toContain('Domain=example.com');
    });
  
    test('integration: header produced respects the byte rule', () => {
      const cookieName = 'sessionid';
      const nameBytes = Buffer.byteLength(cookieName, 'utf8');
      const cookieValue = 'x'.repeat(1000);
      const header = buildSetCookieHeader(cookieName, cookieValue);
      const combined = Buffer.byteLength(cookieName + cookieValue, 'utf8');
      expect(combined).toBeLessThanOrEqual(4096);
      expect(header.startsWith(`${cookieName}=`)).toBe(true);
    });

  test('POST /api/consent/accept sets pdpa_consent cookie with secure attributes when request is HTTPS', async () => {
    const headers = new Headers({ 'x-forwarded-proto': 'https' });
    const req = new NextRequest('http://localhost/api/consent/accept', { method: 'POST', headers });

    const res = await acceptPOST(req as any);

    const sc = res.headers.get('set-cookie') || res.headers.get('Set-Cookie');
    expect(sc).toBeTruthy();
    const lc = String(sc).toLowerCase();

    expect(lc).toContain('pdpa_consent=true');
    expect(lc).toContain('httponly');
    expect(lc).toContain('samesite=strict');
    expect(lc).toContain('path=/');
    expect(lc).toContain('secure');
  });

  test('GET /api/consent/status reads pdpa_consent cookie', async () => {
    const headers = new Headers({ 'cookie': 'pdpa_consent=true' });
    const req = new NextRequest('http://localhost/api/consent/status', { headers });

    const res = await statusGET(req as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(typeof data.consent).toBe('boolean');
    expect(data.consent).toBe(true);
  });

  test('authOptions cookie configuration uses strict session SameSite and httpOnly', () => {
    const sessionCookie = (authOptions.cookies && (authOptions.cookies as any).sessionToken) || null;
    expect(sessionCookie).not.toBeNull();
    expect(sessionCookie.options.httpOnly).toBe(true);
    expect(sessionCookie.options.sameSite).toBe('strict');
    expect(sessionCookie.options.path).toBe('/');
  });
});
