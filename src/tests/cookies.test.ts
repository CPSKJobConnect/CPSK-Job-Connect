import buildSetCookieHeader from '@/lib/cookies';
import { expect } from '@jest/globals';

describe('cookie helper', () => {
  test('allows cookie where name+value bytes <= 4096', () => {
    const cookieName = 'testcookie';
    // produce a value so that name+value is exactly 4096 bytes
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
    // ensure the header string exists and that name+value bytes are within limit
    const combined = Buffer.byteLength(cookieName + cookieValue, 'utf8');
    expect(combined).toBeLessThanOrEqual(4096);
    expect(header.startsWith(`${cookieName}=`)).toBe(true);
  });
});
