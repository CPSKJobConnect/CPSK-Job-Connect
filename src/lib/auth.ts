import { prisma } from "@/lib/db";
import { rotateGoogleRefreshToken } from "@/lib/oauthRefreshTokenService";
import { INTERNAL_JWT_AUDIENCE, INTERNAL_JWT_ISSUER, INTERNAL_JWT_TOKEN_TYPE } from "@/lib/securityConstants";
import bycrypt from "bcryptjs";
import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const MAX_INACTIVITY_MS = 30 * 60 * 1000;

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
  jwt: {
    maxAge: 2 * 60 * 60,
  },
  pages: {
    signIn: "/", // Redirect to home page on sign-in error
    error: "/", // Redirect OAuth errors to home page
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      checks: ["pkce", "state"],
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
            token_version: true,
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
          tokenVersion: user.token_version,
          emailVerified: user.student?.email_verified,
          studentStatus: user.student?.student_status,
          verificationStatus: user.student?.verification_status,
          companyRegistrationStatus: user.company?.registration_status,
        } as User
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      const tokenMeta = token as Record<string, unknown>;
      const now = Date.now();
      const lastActivity =
        typeof tokenMeta.lastActivity === "number" ? (tokenMeta.lastActivity as number) : now;
      const isUpdateTrigger = trigger === "update";

      tokenMeta.aud = INTERNAL_JWT_AUDIENCE;
      tokenMeta.iss = INTERNAL_JWT_ISSUER;
      tokenMeta.tokenType = INTERNAL_JWT_TOKEN_TYPE;

      if (!user && !account && !isUpdateTrigger) {
        if (tokenMeta.sessionLocked) {
          return token;
        }
        // Periodically check token version and active status against DB
        const lastVersionCheck =
          typeof tokenMeta.lastTokenVersionCheck === "number" ? (tokenMeta.lastTokenVersionCheck as number) : 0;
        if (token.sub && now - lastVersionCheck > 60000) {
          const userId = parseInt(token.sub as string, 10);
          if (!Number.isNaN(userId)) {
            const versionRecord = await prisma.account.findUnique({
              where: { id: userId },
              select: { token_version: true, is_active: true },
            });
            tokenMeta.lastTokenVersionCheck = now;
            const tokenVersion = typeof tokenMeta.tokenVersion === "number" ? (tokenMeta.tokenVersion as number) : 0;
            if (!versionRecord || !versionRecord.is_active || versionRecord.token_version !== tokenVersion) {
              tokenMeta.sessionLocked = true;
              return token;
            }
          }
        }
        if (now - lastActivity > MAX_INACTIVITY_MS) {
          tokenMeta.sessionLocked = true;
          tokenMeta.lastActivity = lastActivity;
          return token;
        }
      }

      // Debug logging for OAuth flow
      if (token.email?.includes('@gmail.com') || token.email?.includes('@hotmail.com')) {
        // console.log('🔐 JWT callback - OAuth user:', {
        //   email: token.email,
        //   hasUser: !!user,
        //   hasAccount: !!account,
        //   tokenRole: token.role,
        //   tokenSub: token.sub,
        //   trigger
        // });
      }

      if (user) {
        tokenMeta.sessionLocked = false;
        // `authorize` returns `name` (username) and `role` on first sign-in.
        // Map those to token fields so subsequent requests have them available.
        token.role = (user as User & { role?: string }).role;
        token.username = (user as User & { name?: string; username?: string }).name || (user as User & { username?: string }).username;
        token.logoUrl = user.logoUrl;
        token.backgroundUrl = user.backgroundUrl;
        token.isActive = typeof user.isActive === 'boolean' ? user.isActive : true;
        token.emailVerified = typeof user.emailVerified === 'boolean' ? user.emailVerified : undefined;
        token.studentStatus = user.studentStatus;
        token.verificationStatus = user.verificationStatus;
        token.companyRegistrationStatus = user.companyRegistrationStatus;
        token.tokenVersion = (user as User & { tokenVersion?: number }).tokenVersion ?? 0;
      }

      // Handle session update (when profile image is changed or verification status changes)
      if (trigger === "update") {
        // If no role yet, fetch from database (e.g., after OAuth registration completion)
        if (!token.role && token.sub) {
          console.log('🔄 Update trigger - fetching role from DB for user:', token.sub);
          try {
            const userId = parseInt(token.sub as string, 10)
            if (!Number.isNaN(userId)) {
              const existing = await prisma.account.findUnique({
                where: { id: userId },
                select: {
                  accountRole: { select: { name: true } },
                  username: true,
                  logoUrl: true,
                  backgroundUrl: true,
                  is_active: true,
                  token_version: true,
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
              })
              console.log('📊 Update trigger - fetched data:', {
                found: !!existing,
                role: existing?.accountRole?.name,
              });
              if (existing) {
                token.role = existing.accountRole?.name || token.role
                token.username = existing.username || token.username
                token.logoUrl = existing.logoUrl || token.logoUrl
                token.backgroundUrl = existing.backgroundUrl || token.backgroundUrl
                token.isActive = existing.is_active
                token.emailVerified = existing.student?.email_verified
                token.studentStatus = existing.student?.student_status
                token.verificationStatus = existing.student?.verification_status
                token.companyRegistrationStatus = existing.company?.registration_status
                token.tokenVersion = existing.token_version ?? token.tokenVersion ?? 0
              }
            }
          } catch (err) {
            console.log('Error fetching role during update:', err)
          }
        }

        // Update other session fields
        if (session?.user?.logoUrl) {
          token.logoUrl = session.user.logoUrl;
        }
        if (session?.user?.emailVerified !== undefined) {
          token.emailVerified = session.user.emailVerified;
        }
        if (session?.user?.verificationStatus) {
          token.verificationStatus = session.user.verificationStatus;
        }
        if (session?.user?.companyRegistrationStatus) {
          token.companyRegistrationStatus = session.user.companyRegistrationStatus;
        }
      }

      // for OAuth users - fetch complete user data including verification status
      if (account?.provider === "google") {
        const existingUser = await prisma.account.findUnique({
          where: {
            email: user.email!
          },
          select: {
            id: true,
            username: true,
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
            },
            token_version: true
          }
        })
        if (existingUser) {
          const oauthRefreshToken = (account as Record<string, unknown>)?.refresh_token;
          if (typeof oauthRefreshToken === "string") {
            await rotateGoogleRefreshToken(existingUser.id, oauthRefreshToken);
          }

          // Check if account is disabled
          if (!existingUser.is_active) {
            throw new Error("ACCOUNT_DISABLED:Your account has been disabled. Please contact support for assistance.");
          }

          // Use database ID instead of provider ID to avoid integer overflow
          token.sub = existingUser.id.toString()
          token.role = existingUser.accountRole?.name
          token.username = existingUser.username || undefined
          token.logoUrl = existingUser.logoUrl || undefined
          token.backgroundUrl = existingUser.backgroundUrl || undefined
          token.isActive = existingUser.is_active
          token.emailVerified = existingUser.student?.email_verified
          token.studentStatus = existingUser.student?.student_status
          token.verificationStatus = existingUser.student?.verification_status
          token.companyRegistrationStatus = existingUser.company?.registration_status
          token.tokenVersion = existingUser.token_version ?? token.tokenVersion ?? 0
        }
      }

      // If token exists but role wasn't set (e.g. older session or created without role),
      // try to populate it from the database using the subject (user id).
      if (!token.role && token.sub) {
        console.log('🔄 Fetching role from DB for user:', token.sub);
        try {
          const userId = parseInt(token.sub as string, 10)
          if (!Number.isNaN(userId)) {
            const existing = await prisma.account.findUnique({
              where: { id: userId },
              select: {
                accountRole: { select: { name: true } },
                username: true,
                logoUrl: true,
                backgroundUrl: true,
                is_active: true,
                token_version: true,
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
            })
            console.log('📊 Fetched user data:', {
              found: !!existing,
              role: existing?.accountRole?.name,
              hasStudent: !!existing?.student,
              hasCompany: !!existing?.company
            });
            if (existing) {
              token.role = existing.accountRole?.name || token.role
              token.username = existing.username || token.username
              token.logoUrl = existing.logoUrl || token.logoUrl
              token.backgroundUrl = existing.backgroundUrl || token.backgroundUrl
              token.isActive = existing.is_active
              token.emailVerified = existing.student?.email_verified
              token.studentStatus = existing.student?.student_status
              token.verificationStatus = existing.student?.verification_status
              token.companyRegistrationStatus = existing.company?.registration_status
            }
          }
        } catch (err) {
          console.log('Error populating token from DB:', err)
        }
      }
      tokenMeta.lastActivity = now;
      return token;
    },
    async session({ session, token }) {
      const tokenMeta = token as Record<string, unknown>;
      if (tokenMeta.sessionLocked) {
        return null;
      }
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
  },
  events: {
    async signOut({ token }) {
      const userId = token?.sub ? parseInt(token.sub as string, 10) : NaN;
      if (Number.isNaN(userId)) return;
      try {
        await prisma.account.update({
          where: { id: userId },
          data: { token_version: { increment: 1 } },
        });
      } catch (error) {
        console.error("Failed to bump token_version on signOut:", error);
      }
    },
  },
}
