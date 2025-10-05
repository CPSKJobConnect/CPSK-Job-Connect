// middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    const role = token?.role

    // Public routes
    const publicRoutes = ["/", "/login", "/register", "/jobs"]
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
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Role-based access control RBAC
    if (token) {
      // Redirect users without role to complete registration
      if (!role && !pathname.startsWith("/register/complete")) {
        return NextResponse.redirect(new URL("/register/complete", req.url))
      }

      // Student trying to access company routes
      if (role === "student" && pathname.startsWith("/company")) {
        return NextResponse.redirect(new URL("/student/dashboard", req.url))
      }

      // Company trying to access student routes
      if (role === "company" && pathname.startsWith("/student")) {
        return NextResponse.redirect(new URL("/company/dashboard", req.url))
      }

      // Redirect authenticated users from auth pages and homepage to their dashboard
      if (isPublicRoute && role) {
        if (pathname === "/jobs") {
          {
            return NextResponse.next()
          }
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
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (static assets)
     */
    "/((?!api/auth|api/register|_next/static|_next/image|favicon.ico|assets).*)",
  ],
}