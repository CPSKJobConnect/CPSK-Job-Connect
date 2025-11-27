import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "__Secure-pdpa_consent";

function readCookieFromRequest(req?: NextRequest | Request | { headers?: any; cookies?: any }): string | null {
  if (!req) return null;
  try {
      if ((req as any).cookies && typeof (req as any).cookies.get === "function") {
        const val = (req as any).cookies.get(COOKIE_NAME)
        if (val) return val.value
        const alt = (req as any).cookies.get('pdpa_consent')
        return alt ? alt.value : null
      }

      const header = (req as any).headers?.get ? (req as any).headers.get('cookie') : (req as any).headers?.cookie
      if (!header) return null
      const parts = header.split(';').map((s: string) => s.trim())
      const match = parts.find((s: string) => s.startsWith(COOKIE_NAME + '=') || s.startsWith('pdpa_consent='))
      if (!match) return null
      const eqIdx = match.indexOf('=')
      return match.slice(eqIdx + 1)
  } catch (e) {
    return null
  }
}

async function getLatestConsentFromDB(accountId: number): Promise<boolean> {
  if (!accountId || !Number.isInteger(accountId) || accountId <= 0) return false;

  try {
    const latest = await prisma.accountConsentLog.findFirst({
      where: { account_id: accountId },
      orderBy: { created_at: 'desc' },
      select: { consent: true },
      // Add timeout to prevent long-running queries
      take: 1,
    });
    return !!(latest && latest.consent);
  } catch (error) {
    console.error(`Failed to retrieve consent for account ${accountId}:`, error);
    return false;
  }
}


export async function resolveConsent(options: {
  req?: NextRequest | Request
  res?: NextResponse
  accountId?: number
  syncCookie?: boolean
}): Promise<{ consent: boolean }> {
  const { req, res, accountId } = options || {}
  const cookieVal = readCookieFromRequest(req)
  const sync = Boolean((options as any)?.syncCookie)

  // Validate accountId to prevent injection
  if (typeof accountId === 'number' && Number.isInteger(accountId) && accountId > 0) {
    const dbConsent = await getLatestConsentFromDB(accountId)

    // Only sync cookie when explicitly requested and a response object is provided.
    if (res && sync) {
      try {
        const forwardedProto = (req as any)?.headers?.get?.('x-forwarded-proto') || (req as any)?.headers?.get?.('x-forwarded-protocol')
        const isHttps = forwardedProto ? String(forwardedProto).split(',')[0].trim() === 'https' : (() => {
          try {
            return new URL((req as any)?.url).protocol === 'https:';
          } catch (e) {
            return false;
          }
        })()

        const secureFlag = process.env.NODE_ENV === 'production' || process.env.LOCAL_HTTPS === 'true' || isHttps

        if (dbConsent) {
          if (cookieVal !== 'true') {
            res.cookies.set(COOKIE_NAME, 'true', {
              httpOnly: true,
              sameSite: 'strict',
              path: '/',
              maxAge: 30 * 24 * 60 * 60,
              secure: secureFlag,
            })
          }
        } else {
          // clear both modern and legacy cookies
          res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/', secure: process.env.NODE_ENV === 'production' || process.env.LOCAL_HTTPS === 'true' })
          try { res.cookies.set('pdpa_consent', '', { maxAge: 0, path: '/', secure: process.env.NODE_ENV === 'production' || process.env.LOCAL_HTTPS === 'true' }) } catch (e) { /* best-effort */ }
        }
      } catch (e) {
        // noop: cookie sync is best-effort
      }
    }

    return { consent: !!dbConsent }
  }

  if (cookieVal === 'true') return { consent: true }
  return { consent: false }
}

export { COOKIE_NAME };
export { getLatestConsentFromDB };
