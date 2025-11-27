import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { COOKIE_NAME, getLatestConsentFromDB } from "@/lib/consent";

// Rate limiting for status checks
const statusAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_STATUS_ATTEMPTS = 30;
const STATUS_WINDOW_MS = 60 * 1000; // 1 minute

function checkStatusRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = statusAttempts.get(identifier);

  if (record) {
    if (now - record.firstAttempt > STATUS_WINDOW_MS) {
      statusAttempts.delete(identifier);
      return true;
    }
    if (record.count >= MAX_STATUS_ATTEMPTS) {
      return false;
    }
    record.count++;
  } else {
    statusAttempts.set(identifier, { count: 1, firstAttempt: now });
  }
  return true;
}

export async function GET(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    // Rate limiting check
    if (!checkStatusRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many status check attempts. Please try again later.' },
        { status: 429 }
      );
    }

    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (e) {
      // getServerSession may throw when headers() is not available in test context.
      session = null;
    }
    const forwardedProto = req.headers.get?.('x-forwarded-proto') || req.headers.get?.('x-forwarded-protocol');
    const isHttps = forwardedProto ? String(forwardedProto).split(',')[0].trim() === 'https' : (() => {
      try { return new URL(req.url).protocol === 'https:' } catch { return false }
    })();
    const secureFlag = process.env.NODE_ENV === 'production' || process.env.LOCAL_HTTPS === 'true' || isHttps;

    if (session?.user?.id) {
      const accountId = parseInt(String(session.user.id), 10);
      const dbConsent = await getLatestConsentFromDB(accountId);

      const res = NextResponse.json({ consent: dbConsent }, { status: 200 });

      try {
        if (dbConsent) {
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
        console.error('Failed to sync cookie in status route:', e);
      }

      return res;
    }

    // Try Request cookies API first, otherwise fall back to parsing the raw header (useful in tests).
    const cookieStore = (req as any).cookies && typeof (req as any).cookies.get === "function" ? (req as any).cookies : null;
    let cookie = cookieStore ? (cookieStore.get(COOKIE_NAME) || cookieStore.get("pdpa_consent")) : undefined;
    if (!cookie) {
      const header = req.headers.get?.('cookie') || req.headers.get?.('Cookie') || '';
      if (header) {
        const parts = header.split(';').map(s => s.trim());
        const match = parts.find((s: string) => s.startsWith(COOKIE_NAME + '=') || s.startsWith('pdpa_consent='));
        if (match) {
          const [, val] = match.split('=');
          cookie = { value: val } as any;
        }
      }
    }

    if (cookie?.value === "true") {
      return NextResponse.json({ consent: true }, { status: 200 });
    }

    return NextResponse.json({ consent: false }, { status: 200 });
  } catch (err) {
    console.error("Error reading consent status:", err);
    return NextResponse.json({ consent: false }, { status: 200 });
  }
}
