import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { COOKIE_NAME, getLatestConsentFromDB } from "@/lib/consent";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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

    const cookieStore = (req as any).cookies && typeof (req as any).cookies.get === "function" ? (req as any).cookies : null;
    const cookie = cookieStore ? (cookieStore.get(COOKIE_NAME) || cookieStore.get("pdpa_consent")) : undefined;
    if (cookie?.value === "true") {
      return NextResponse.json({ consent: true }, { status: 200 });
    }

    return NextResponse.json({ consent: false }, { status: 200 });
  } catch (err) {
    console.error("Error reading consent status:", err);
    return NextResponse.json({ consent: false }, { status: 200 });
  }
}
