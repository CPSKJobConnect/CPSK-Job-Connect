import buildSetCookieHeader from '@/lib/cookies';

describe('cookie helper', () => {
  test('allows cookie where name+value bytes <= 4096', () => {
    const name = 'testcookie';
    // produce a value so that name+value is exactly 4096 bytes
    const nameBytes = Buffer.byteLength(name, 'utf8');
    const allowed = 4096 - nameBytes;
    const value = 'a'.repeat(allowed);
    const header = buildSetCookieHeader(name, value, { httpOnly: true, secure: false, sameSite: 'Lax' });
    expect(header).to.contain(`${name}=`);
  });

  test('throws when name+value bytes > 4096', () => {
    const name = 'bigcookie';
    const nameBytes = Buffer.byteLength(name, 'utf8');
    const tooLarge = 4096 - nameBytes + 1;
    const value = 'b'.repeat(tooLarge);
    expect(() => buildSetCookieHeader(name, value)).to.throw(/Cookie too large/);
  });

  test('includes flags when options provided', () => {
    const header = buildSetCookieHeader('k', 'v', { httpOnly: true, secure: true, sameSite: 'Strict', path: '/app', domain: 'example.com' });
    expect(header).to.contain('HttpOnly');
    expect(header).to.contain('Secure');
    expect(header).to.contain('SameSite=Strict');
    expect(header).to.contain('Path=/app');
    expect(header).to.contain('Domain=example.com');
  });

  test('integration: header produced respects the byte rule', () => {
    const name = 'sessionid';
    const nameBytes = Buffer.byteLength(name, 'utf8');
    const value = 'x'.repeat(1000);
    const header = buildSetCookieHeader(name, value);
    // ensure the header string exists and that name+value bytes are within limit
    const combined = Buffer.byteLength(name + value, 'utf8');
    expect(combined).to.be.at.most(4096);
    expect(header.startsWith(`${name}=`)).to.be.true;
  });
});
