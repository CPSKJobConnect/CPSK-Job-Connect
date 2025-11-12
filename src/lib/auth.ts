import { prisma } from "@/lib/db";
import bycrypt from "bcryptjs";
import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
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
          throw new Error("Invalid credentials");
        }

        // Check if this is an OAuth account (no password set)
        if (!user.password) {
          throw new Error("OAUTH_ACCOUNT:This account uses Google sign-in. Please click 'Continue with Google' to login.");
        }

        const isPasswordValid = await bycrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

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
      // Debug logging for OAuth flow
      if (token.email?.includes('@gmail.com') || token.email?.includes('@hotmail.com')) {
        console.log('🔐 JWT callback - OAuth user:', {
          email: token.email,
          hasUser: !!user,
          hasAccount: !!account,
          tokenRole: token.role,
          tokenSub: token.sub,
          trigger
        });
      }

      if (user) {
        // `authorize` returns `name` (username) and `role` on first sign-in.
        // Map those to token fields so subsequent requests have them available.
        token.role = (user as User & { role?: string }).role;
        token.username = (user as User & { name?: string; username?: string }).name || (user as User & { username?: string }).username;
        token.logoUrl = user.logoUrl;
        token.backgroundUrl = user.backgroundUrl;
        token.emailVerified = typeof user.emailVerified === 'boolean' ? user.emailVerified : undefined;
        token.studentStatus = user.studentStatus;
        token.verificationStatus = user.verificationStatus;
        token.companyRegistrationStatus = user.companyRegistrationStatus;
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
                token.emailVerified = existing.student?.email_verified
                token.studentStatus = existing.student?.student_status
                token.verificationStatus = existing.student?.verification_status
                token.companyRegistrationStatus = existing.company?.registration_status
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
        })
        if (existingUser) {
          // Use database ID instead of provider ID to avoid integer overflow
          token.sub = existingUser.id.toString()
          token.role = existingUser.accountRole?.name
          token.username = existingUser.username || undefined
          token.logoUrl = existingUser.logoUrl || undefined
          token.backgroundUrl = existingUser.backgroundUrl || undefined
          token.emailVerified = existingUser.student?.email_verified
          token.studentStatus = existingUser.student?.student_status
          token.verificationStatus = existingUser.student?.verification_status
          token.companyRegistrationStatus = existingUser.company?.registration_status
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
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.username = token.username as string
        session.user.logoUrl = token.logoUrl as string
        session.user.backgroundUrl = token.backgroundUrl as string
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
          return false;
        }
      }
      return true;
    }
  }
}