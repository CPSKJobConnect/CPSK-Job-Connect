// middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    const role = token?.role?.toLowerCase()

    console.log("🔍 Middleware hit:", pathname, "Role:", role)
    // TEMPORARY BYPASS for admin routes
    // if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    //   console.log("⚙️ Skipping middleware for admin routes (temporary)")
    //   return NextResponse.next()
    // }

    // Public routes
    const publicRoutes = ["/", "/login", "/register", "/jobs", "/api/jobs", "/student/verify-email"]
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
        // Try to extract role hint from multiple sources:
        // 1. Current path: /login/student or /register/company
        // 2. Dashboard paths: /student/dashboard or /company/dashboard
        const roleMatch = pathname.match(/\/(login|register|student|company)\/(student|company|dashboard)/)
        let roleHint = null

        if (roleMatch) {
          // If the path contains /student/ or /company/, use that as the role
          if (roleMatch[1] === 'student' || roleMatch[1] === 'company') {
            roleHint = roleMatch[1]
          }
          // Otherwise check if the second part is student or company
          else if (roleMatch[2] === 'student' || roleMatch[2] === 'company') {
            roleHint = roleMatch[2]
          }
        }

        if (roleHint) {
          // Redirect directly to role-specific registration form
          return NextResponse.redirect(new URL(`/register/complete/${roleHint}`, req.url))
        } else {
          // No role hint, go to role selection page
          return NextResponse.redirect(new URL("/register/complete", req.url))
        }
      }

      // Check if student needs email verification for job application
      if (role === "student" && pathname.startsWith("/student/job-apply/")) {
        const emailVerified = token.emailVerified;
        const studentStatus = token.studentStatus;
        const verificationStatus = token.verificationStatus;

        // Current students must verify email before applying for jobs
        if (studentStatus === "CURRENT" && !emailVerified) {
          const verifyUrl = new URL("/student/verify-email", req.url);
          verifyUrl.searchParams.set("email", token.email || "");
          return NextResponse.redirect(verifyUrl);
        }

        // Alumni who are approved must verify email before applying for jobs
        if (studentStatus === "ALUMNI" && verificationStatus === "APPROVED" && !emailVerified) {
          const verifyUrl = new URL("/student/verify-email", req.url);
          verifyUrl.searchParams.set("email", token.email || "");
          return NextResponse.redirect(verifyUrl);
        }

        // Alumni with PENDING status cannot apply (redirect to dashboard)
        if (studentStatus === "ALUMNI" && verificationStatus === "PENDING") {
          return NextResponse.redirect(new URL("/student/dashboard", req.url));
        }

        // Alumni with REJECTED status cannot apply (redirect to dashboard)
        if (studentStatus === "ALUMNI" && verificationStatus === "REJECTED") {
          return NextResponse.redirect(new URL("/student/dashboard", req.url));
        }
      }

      // Check if company is verified for job posting
      if (role === "company" && pathname.startsWith("/company/jobs/create")) {
        const companyRegistrationStatus = token.companyRegistrationStatus;

        // Only APPROVED companies can create jobs
        if (companyRegistrationStatus !== "APPROVED") {
          return NextResponse.redirect(new URL("/company/dashboard", req.url));
        }
      }

      // Student trying to access company or admin routes
      if (role === "student" && (pathname.startsWith("/company") || pathname.startsWith("/admin"))) {
        return NextResponse.redirect(new URL("/student/dashboard", req.url))
      }

      // Company trying to access student or admin routes
      if (role === "company" && (pathname.startsWith("/student") || pathname.startsWith("/admin"))) {
        return NextResponse.redirect(new URL("/company/dashboard", req.url))
      }

      // Admin trying to access student or company routes
      if (role === "admin" && (pathname.startsWith("/student") || pathname.startsWith("/company"))) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url))
      }

      // Only admins can access /admin routes
      if (pathname.startsWith("/admin") && role !== "admin") {
        return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url))
      }

      // Redirect authenticated users from auth pages and homepage to their dashboard
      if (isPublicRoute && role && !pathname.startsWith("/api")) {
        if (pathname === "/jobs" || pathname === "/student/verify-email") {
          return NextResponse.next() // allow access to public jobs page and verify-email page
        }
        return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => {
        // Always return true to let the middleware function handle all redirects
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (static assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|assets).*)",
  ],
}