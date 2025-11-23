// middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl
    const delegatedToken = (req as any).nextauth?.token
    let token = delegatedToken
    if (delegatedToken) {
      console.log('MIDDLEWARE: token from req.nextauth.token ->', { sub: delegatedToken.sub, role: delegatedToken.role })
    } else {
      try {
        token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
        console.log('MIDDLEWARE FALLBACK: decoded token ->', token)
      } catch (err) {
        console.log('MIDDLEWARE FALLBACK: failed to decode token ->', err)
        token = null
      }
    }

    if (!token) {
      try {
        const rawToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, raw: true }).catch(() => null)
        if (rawToken) console.log('MIDDLEWARE FALLBACK: raw token (truncated) ->', String(rawToken).slice(0, 200))
        else console.log('MIDDLEWARE FALLBACK: raw token not available')
      } catch (e) {
        console.log('MIDDLEWARE FALLBACK: raw token attempt failed ->', e)
      }

      try {
        const cookieHeader = req.headers.get('cookie') || ''
        const origin = req.nextUrl?.origin || `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host')}`
        console.log('MIDDLEWARE FALLBACK: token null, attempting /api/auth/session', {
          origin,
          hasCookie: !!cookieHeader,
          cookiePreview: cookieHeader ? cookieHeader.slice(0, 200) : '',
          hasSecret: !!process.env.NEXTAUTH_SECRET,
        })

        const sessionRes = await fetch(new URL('/api/auth/session', origin).toString(), {
          headers: {
            cookie: cookieHeader,
          },
          cache: 'no-store',
        })

        console.log('MIDDLEWARE FALLBACK: /api/auth/session status ->', sessionRes.status)

        if (sessionRes.ok) {
          const sessionJson = await sessionRes.json()
          console.log('MIDDLEWARE FALLBACK: /api/auth/session body ->', JSON.stringify({ user: sessionJson?.user ? { id: sessionJson.user.id, role: sessionJson.user.role, email: sessionJson.user.email } : null }))
          if (sessionJson?.user) {
            token = {
              sub: sessionJson.user.id,
              role: sessionJson.user.role,
              email: sessionJson.user.email,
              username: sessionJson.user.username || sessionJson.user.name,
              logoUrl: sessionJson.user.logoUrl,
              backgroundUrl: sessionJson.user.backgroundUrl,
              isActive: sessionJson.user.isActive,
              emailVerified: sessionJson.user.emailVerified,
              studentStatus: sessionJson.user.studentStatus,
              verificationStatus: sessionJson.user.verificationStatus,
              companyRegistrationStatus: sessionJson.user.companyRegistrationStatus,
            } as any
            console.log('MIDDLEWARE FALLBACK: populated token from /api/auth/session ->', { sub: token.sub, role: token.role })
          }
        } else {
          const text = await sessionRes.text().catch(() => '')
          console.log('MIDDLEWARE FALLBACK: /api/auth/session non-ok body ->', text.slice(0, 1000))
        }
      } catch (err) {
        console.log('MIDDLEWARE FALLBACK: /api/auth/session fetch failed ->', err)
      }
    }

    try {
      const hasSessionCookie = Boolean(
        (req.cookies?.get && req.cookies.get('next-auth.session-token')) ||
        (req.cookies && (req.cookies as any)['next-auth.session-token'])
      )
      if (!token && process.env.NODE_ENV !== 'production' && hasSessionCookie) {
        console.log('DEV BYPASS: token missing but session cookie present — allowing request in dev')
        return NextResponse.next()
      }
    } catch (e) {
      // ignore cookie-read errors
    }


    const role = token?.role?.toLowerCase()
    console.log("🔍 Middleware hit:", pathname, "Role:", role)
    console.log("MIDDLEWARE DEBUG: req.cookies ->", req.cookies)

    // Check if account is disabled (from JWT token)
    if (token && token.isActive === false) {
      console.log("🚫 Account is disabled, redirecting to login")
      if (role === "student") {
        return NextResponse.redirect(new URL("/login/student?error=account_disabled", req.url))
      } else if (role === "company") {
        return NextResponse.redirect(new URL("/login/company?error=account_disabled", req.url))
      } else if (role === "admin") {
        return NextResponse.redirect(new URL("/login/admin?error=account_disabled", req.url))
      }
      return NextResponse.redirect(new URL("/?error=account_disabled", req.url))
    }

    // Public routes
    const publicRoutes = ["/", "/login", "/register", "/jobs", "/api/jobs", "/student/verify-email", "/privacy-policy", , "/forgot-password", "/reset-password"]
    const isPublicRoute = publicRoutes.some(route =>
      pathname === route || pathname.startsWith(`${route}/`)
    )

    // If accessing protected routes without authentication
    if (!isPublicRoute && !token) {
      if (pathname.startsWith("/student")) {
        const loginUrl = new URL("/login/student", req.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
      }
      if (pathname.startsWith("/company")) {
        const loginUrl = new URL("/login/company", req.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
      }
      if (pathname.startsWith("/admin")) {
        const loginUrl = new URL("/login/admin", req.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
      }
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Role-based access control RBAC
    if (token) {
      // Redirect users without role to complete registration
      if (!role && !pathname.startsWith("/register/complete")) {
        const roleMatch = pathname.match(/\/(login|register|student|company)\/(student|company|dashboard)/)
        let roleHint = null
        if (roleMatch) {
          if (roleMatch[1] === 'student' || roleMatch[1] === 'company') roleHint = roleMatch[1]
          else if (roleMatch[2] === 'student' || roleMatch[2] === 'company') roleHint = roleMatch[2]
        }
        if (roleHint) return NextResponse.redirect(new URL(`/register/complete/${roleHint}`, req.url))
        return NextResponse.redirect(new URL("/register/complete", req.url))
      }

      // Check if student needs email verification for job application
      if (role === "student" && pathname.startsWith("/student/job-apply/")) {
        const emailVerified = token.emailVerified
        const studentStatus = token.studentStatus
        const verificationStatus = token.verificationStatus
        if ((studentStatus === "CURRENT" && !emailVerified) ||
            (studentStatus === "ALUMNI" && verificationStatus === "APPROVED" && !emailVerified)) {
          const verifyUrl = new URL("/student/verify-email", req.url)
          verifyUrl.searchParams.set("email", token.email || "")
          return NextResponse.redirect(verifyUrl)
        }
        if ((studentStatus === "ALUMNI" && verificationStatus === "PENDING") ||
            (studentStatus === "ALUMNI" && verificationStatus === "REJECTED")) {
          return NextResponse.redirect(new URL("/student/dashboard", req.url))
        }
      }

      // Company job posting
      if (role === "company" && pathname.startsWith("/company/jobs/create")) {
        if (token.companyRegistrationStatus !== "APPROVED") {
          return NextResponse.redirect(new URL("/company/dashboard", req.url))
        }
      }

      // Role-based access control
      if (role === "student" && (pathname.startsWith("/company") || pathname.startsWith("/admin"))) {
        return NextResponse.redirect(new URL("/student/dashboard", req.url))
      }
      if (role === "company" && (pathname.startsWith("/student") || pathname.startsWith("/admin"))) {
        return NextResponse.redirect(new URL("/company/dashboard", req.url))
      }
      if (role === "admin" && (pathname.startsWith("/student") || pathname.startsWith("/company"))) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url))
      }
      if (pathname.startsWith("/admin") && role !== "admin") {
        return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url))
      }

      // Redirect authenticated users from auth pages/homepage to their dashboard
      if (isPublicRoute && role && !pathname.startsWith("/api")) {
        if (pathname === "/jobs" || pathname === "/student/verify-email") return NextResponse.next()
        return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: { authorized: () => true },
  }
)

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets).*)"],
}
