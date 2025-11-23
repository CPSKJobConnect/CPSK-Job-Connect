import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { COOKIE_NAME } from "@/lib/consent";

export async function PATCH(req: NextRequest) {
  try {
    try {
      const cookieHeader = req.headers.get?.('cookie') || req.headers.get?.('Cookie');
      console.debug('[consent:update-status] incoming request url=', req.url, 'cookie=', cookieHeader);
    } catch (e) { /* ignore */ }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.consent !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const consentValue: boolean = body.consent;

    const forwardedProto = req.headers.get?.('x-forwarded-proto') || req.headers.get?.('x-forwarded-protocol');
    const isHttps = forwardedProto ? String(forwardedProto).split(',')[0].trim() === 'https' : (() => {
      try {
        return new URL(req.url).protocol === 'https:';
      } catch (e) {
        return false;
      }
    })();
    const secureFlag = process.env.NODE_ENV === 'production' || process.env.LOCAL_HTTPS === 'true' || isHttps;

    try {
      const session = await getServerSession(authOptions);
      const res = NextResponse.json({ consent: consentValue }, { status: 200 });

      if (session?.user?.id) {
        const accountId = parseInt(String(session.user.id), 10);
        try {
            const existing = await prisma.accountConsentLog.findFirst({ where: { account_id: accountId }, orderBy: { created_at: 'desc' } });
            if (existing) {
              await prisma.accountConsentLog.update({ where: { id: existing.id }, data: { consent: consentValue, created_at: new Date() } });
            } else {
              await prisma.accountConsentLog.create({ data: { account_id: accountId, consent: consentValue } });
            }
        } catch (e) {
          console.error('Failed to persist consent for account in update-status route:', e);
          return NextResponse.json({ error: 'Failed to persist consent' }, { status: 500 });
        }

        try {
          if (consentValue) {
            res.cookies.set(COOKIE_NAME, 'true', {
              httpOnly: true,
              sameSite: 'strict',
              path: '/',
              maxAge: 30 * 24 * 60 * 60,
              secure: secureFlag,
            });
          } else {
            res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/', secure: secureFlag });
            try { res.cookies.set('pdpa_consent', '', { maxAge: 0, path: '/', secure: secureFlag }); } catch (_) { }
          }
        } catch (e) {
          console.error('Failed to sync cookie after DB update:', e);
        }

        return res;
      }

      try {
        if (consentValue) {
          res.cookies.set(COOKIE_NAME, 'true', {
            httpOnly: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 30 * 24 * 60 * 60,
            secure: secureFlag,
          });
        } else {
          res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/', secure: secureFlag });
          try { res.cookies.set('pdpa_consent', '', { maxAge: 0, path: '/', secure: secureFlag }); } catch (_) { }
        }
      } catch (e) {
        console.error('Failed to manage cookies for unauthenticated user in update-status route:', e);
      }

      return res;
    } catch (e) {
      console.error('Failed to get session in update-status route:', e);
      return NextResponse.json({ error: 'Failed to determine session' }, { status: 500 });
    }
  } catch (err) {
    console.error('Error in update-status route:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
