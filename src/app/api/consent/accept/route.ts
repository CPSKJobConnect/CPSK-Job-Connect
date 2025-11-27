import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { COOKIE_NAME } from "@/lib/consent";

// Rate limiting for consent actions
const consentAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_CONSENT_ATTEMPTS = 10;
const CONSENT_WINDOW_MS = 60 * 1000; // 1 minute

function checkConsentRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = consentAttempts.get(identifier);

  if (record) {
    if (now - record.firstAttempt > CONSENT_WINDOW_MS) {
      consentAttempts.delete(identifier);
      return true;
    }
    if (record.count >= MAX_CONSENT_ATTEMPTS) {
      return false;
    }
    record.count++;
  } else {
    consentAttempts.set(identifier, { count: 1, firstAttempt: now });
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    // Rate limiting check
    if (!checkConsentRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many consent attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const forwardedProto = req.headers.get?.('x-forwarded-proto') || req.headers.get?.('x-forwarded-protocol');
    const isHttps = forwardedProto ? String(forwardedProto).split(',')[0].trim() === 'https' : false;
    const secureFlag = process.env.NODE_ENV === 'production' || process.env.LOCAL_HTTPS === 'true' || isHttps;

    // Get session to persist consent to database if user is authenticated
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (e) {
      // Session retrieval failed, continue with cookie-only consent
      console.debug('Session not available for consent accept');
    }

    const res = NextResponse.json({ consent: true }, { status: 200 });

    // If authenticated, persist to database
    if (session?.user?.id) {
      const accountId = parseInt(String(session.user.id), 10);
      if (!isNaN(accountId)) {
        try {
          // Use upsert pattern for atomicity
          const existing = await prisma.accountConsentLog.findFirst({
            where: { account_id: accountId },
            orderBy: { created_at: 'desc' },
          });

          if (existing) {
            await prisma.accountConsentLog.update({
              where: { id: existing.id },
              data: { consent: true, created_at: new Date() },
            });
          } else {
            await prisma.accountConsentLog.create({
              data: { account_id: accountId, consent: true },
            });
          }

          console.log(`Consent accepted and persisted for account ${accountId}`);
        } catch (dbError) {
          console.error('Failed to persist consent to database:', dbError);
          // Continue with cookie-only consent even if DB fails
        }
      }
    }

    // Set consent cookie
    try {
      res.cookies.set(COOKIE_NAME, 'true', {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        secure: secureFlag,
      });
    } catch (e) {
      console.error('Failed to set consent cookie in accept route', e);
    }

    return res;
  } catch (err) {
    console.error('Error in consent accept route:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
