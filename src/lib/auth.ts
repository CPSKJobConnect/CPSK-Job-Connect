import { prisma } from "@/lib/db";
import bycrypt from "bcryptjs";
import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// Rate limiting for login attempts
interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

const loginAttemptsMap = new Map<string, LoginAttempt>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(email: string): { allowed: boolean; remainingMinutes?: number } {
  const identifier = email.toLowerCase().trim();
  const now = Date.now();
  const attemptRecord = loginAttemptsMap.get(identifier);

  if (attemptRecord) {
    // Reset if window has passed
    if (now - attemptRecord.firstAttempt > WINDOW_MS) {
      loginAttemptsMap.delete(identifier);
      return { allowed: true };
    }

    // Check if locked out
    if (attemptRecord.count >= MAX_ATTEMPTS) {
      const timeSinceLastAttempt = now - attemptRecord.lastAttempt;
      if (timeSinceLastAttempt < LOCKOUT_MS) {
        const remainingMinutes = Math.ceil((LOCKOUT_MS - timeSinceLastAttempt) / 60000);
        return { allowed: false, remainingMinutes };
      } else {
        // Lockout expired
        loginAttemptsMap.delete(identifier);
        return { allowed: true };
      }
    }
  }

  return { allowed: true };
}

function recordFailedAttempt(email: string): number {
  const identifier = email.toLowerCase().trim();
  const now = Date.now();
  const existing = loginAttemptsMap.get(identifier);

  if (existing) {
    existing.count += 1;
    existing.lastAttempt = now;
  } else {
    loginAttemptsMap.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
  }

  const updated = loginAttemptsMap.get(identifier);
  return updated ? Math.max(0, MAX_ATTEMPTS - updated.count) : MAX_ATTEMPTS;
}

function clearFailedAttempts(email: string) {
  const identifier = email.toLowerCase().trim();
  loginAttemptsMap.delete(identifier);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 hours (7200 seconds)
    updateAge: 15 * 60, // Update session every 15 minutes (900 seconds)
  },
  // Explicit cookie settings to enforce secure attributes per ASVS
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production' || process.env.LOCAL_HTTPS === 'true',
      }
    },
    // optional: CSRF token cookie settings (NextAuth uses this internally)
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  },
  pages: {
    signIn: "/", // Redirect to home page on sign-in error
    error: "/", // Redirect OAuth errors to home page
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "Enter your email"
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password"
        },
        role: {
          label: "Role",
          type: "text"
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Invalid credentials");
        }

        // Check rate limit
        const rateLimitCheck = checkRateLimit(credentials.email);
        if (!rateLimitCheck.allowed) {
          throw new Error(`RATE_LIMIT:Account temporarily locked. Please try again in ${rateLimitCheck.remainingMinutes} minute(s).`);
        }

        const user = await prisma.account.findUnique({
          where: {
            email: credentials.email,
          },
          select: {
            id: true,
            email: true,
            username: true,
            password: true,
            role: true,
            logoUrl: true,
            backgroundUrl: true,
            is_active: true,
            accountRole: {
              select: {
                name: true
              }
            },
            student: {
              select: {
                email_verified: true,
                student_status: true,
                verification_status: true
              }
            },
            company: {
              select: {
                registration_status: true
              }
            }
          }
        });

        if (!user) {
          const attemptsRemaining = recordFailedAttempt(credentials.email);
          throw new Error(`INVALID_CREDENTIALS:${attemptsRemaining}`);
        }

        // Check if account is disabled
        if (!user.is_active) {
          throw new Error("ACCOUNT_DISABLED:Your account has been disabled. Please contact support for assistance.");
        }

        // Check if this is an OAuth account (no password set)
        if (!user.password) {
          throw new Error("OAUTH_ACCOUNT:This account uses Google sign-in. Please click 'Continue with Google' to login.");
        }

        const isPasswordValid = await bycrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          const attemptsRemaining = recordFailedAttempt(credentials.email);
          throw new Error(`INVALID_CREDENTIALS:${attemptsRemaining}`);
        }

        // Successful login - clear failed attempts
        clearFailedAttempts(credentials.email);

        // Validate role matches (if role is provided in credentials)
        if (credentials.role) {
          const userRole = user.accountRole?.name?.toLowerCase();
          const requestedRole = credentials.role.toLowerCase();

          if (userRole !== requestedRole) {
            // Create a more helpful error message based on the actual role
            const roleLabel = userRole === 'student' ? 'Student' : userRole === 'company' ? 'Company' : userRole;
            throw new Error(`ROLE_MISMATCH:${userRole}:This account is registered as a ${roleLabel}. Please use the ${roleLabel} login page.`);
          }
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.username,
          role: user.accountRole?.name,
          logoUrl: user.logoUrl,
          backgroundUrl: user.backgroundUrl,
          isActive: user.is_active,
          emailVerified: user.student?.email_verified,
          studentStatus: user.student?.student_status,
          verificationStatus: user.student?.verification_status,
          companyRegistrationStatus: user.company?.registration_status,
        } as User
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
  // Step 1: map fields on first sign-in
  if (user) {
    token.sub = user.id;
    token.role = user.role || undefined;
    token.username = user.username ?? user.name ?? undefined;
    token.logoUrl = user.logoUrl;
    token.backgroundUrl = user.backgroundUrl;
    token.isActive = user.isActive ?? true;
    token.emailVerified = Boolean(user.emailVerified);
    token.studentStatus = user.studentStatus;
    token.verificationStatus = user.verificationStatus;
    token.companyRegistrationStatus = user.companyRegistrationStatus;
  }

  // Step 2: if role missing, fetch DB once
  if (!token.role && token.sub) {
    try {
      const userId = parseInt(token.sub as string, 10);
      if (!Number.isNaN(userId)) {
        const existing = await prisma.account.findUnique({
          where: { id: userId },
          select: {
            accountRole: { select: { name: true } },
            username: true,
            logoUrl: true,
            backgroundUrl: true,
            is_active: true,
            student: { select: { email_verified: true, student_status: true, verification_status: true } },
            company: { select: { registration_status: true } },
          },
        });
        if (existing) {
          token.role = existing.accountRole?.name;
          token.username = existing.username || token.username;
          token.logoUrl = existing.logoUrl || token.logoUrl;
          token.backgroundUrl = existing.backgroundUrl || token.backgroundUrl;
          token.isActive = existing.is_active;
          token.emailVerified = Boolean(existing.student?.email_verified);
          token.studentStatus = existing.student?.student_status;
          token.verificationStatus = existing.student?.verification_status;
          token.companyRegistrationStatus = existing.company?.registration_status;
        }
      }
    } catch (err) {
      console.error("Error populating token from DB:", err);
    }
  }

  return token;
},
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.username = token.username as string
        session.user.logoUrl = token.logoUrl as string
        session.user.backgroundUrl = token.backgroundUrl as string
        session.user.isActive = token.isActive
        session.user.emailVerified = token.emailVerified
        session.user.studentStatus = token.studentStatus
        session.user.verificationStatus = token.verificationStatus
        session.user.companyRegistrationStatus = token.companyRegistrationStatus
      }
      // Debug: print session contents in non-production environments
      try {
        if (process.env.NODE_ENV !== 'production') {
          const safe = {
            sub: token?.sub,
            role: token?.role,
            email: token?.email,
            username: token?.username,
          };
          console.log('AUTH: session callback ->', JSON.stringify(safe));
        }
      } catch (e) {
        // ignore
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.account.findUnique({
            where: {
              email: user.email!
            },
            select: {
              id: true,
              role: true,
              student: {
                select: {
                  id: true
                }
              },
              company: {
                select: {
                  id: true
                }
              }
            }
          });

          if (!existingUser) {
            // Create new user but without role (needs to complete registration)
            await prisma.account.create({
              data: {
                email: user.email!,
                username: profile?.name || user.name,
                logoUrl: user.image!,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                emailVerified: new Date(),
              }
            });
            // Allow sign in, middleware will redirect to /register/complete
            return true;
          }

          // Existing user - check if they have completed registration
          if (!existingUser.role) {
            // Account exists but no role, needs to complete registration
            return true;
          }

          // Check if they have completed role-specific profile
          const roleRecord = await prisma.accountRole.findUnique({
            where: { id: existingUser.role }
          });
          const roleName = roleRecord?.name?.toLowerCase();

          if (roleName === "student" && !existingUser.student) {
            // Has student role but no student profile, needs to complete
            return true;
          }
          if (roleName === "company" && !existingUser.company) {
            // Has company role but no company profile, needs to complete
            return true;
          }

          // All good, allow sign in
          return true;
        } catch (error) {
          console.error("Error in OAuth sign-in:", error);
          // Return false will redirect to error page with error=OAuthSignin
          // The error page is configured in pages.error above
          return false;
        }
      }
      return true;
    }
  }
}
