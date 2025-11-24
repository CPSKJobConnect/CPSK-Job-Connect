import { prisma } from "@/lib/db";
import bycrypt from "bcryptjs";
import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
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

        // ===== OWASP ASVS 1.1.1: Canonicalize inputs =====
        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password.trim();
        const role = credentials.role?.trim().toLowerCase();

        const user = await prisma.account.findUnique({
          where: {
            email,
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

        if (!user) throw new Error("Invalid credentials");

        if (!user.is_active) {
          throw new Error("ACCOUNT_DISABLED:Your account has been disabled. Please contact support for assistance.");
        }

        if (!user.password) {
          throw new Error("OAUTH_ACCOUNT:This account uses Google sign-in. Please click 'Continue with Google' to login.");
        }

        const isPasswordValid = await bycrypt.compare(password, user.password);
        if (!isPasswordValid) throw new Error("Invalid credentials");

        if (role) {
          const userRole = user.accountRole?.name?.toLowerCase();
          if (userRole !== role) {
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
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.role = (user as User & { role?: string }).role;
        token.username = (user as User & { name?: string; username?: string }).name || (user as User & { username?: string }).username;
        token.logoUrl = user.logoUrl;
        token.backgroundUrl = user.backgroundUrl;
        token.isActive = typeof user.isActive === 'boolean' ? user.isActive : true;
        token.emailVerified = typeof user.emailVerified === 'boolean' ? user.emailVerified : undefined;
        token.studentStatus = user.studentStatus;
        token.verificationStatus = user.verificationStatus;
        token.companyRegistrationStatus = user.companyRegistrationStatus;
      }

      if (trigger === "update") {
        if (!token.role && token.sub) {
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
                  student: { select: { email_verified: true, student_status: true, verification_status: true } },
                  company: { select: { registration_status: true } }
                }
              })
              if (existing) {
                token.role = existing.accountRole?.name || token.role;
                token.username = existing.username || token.username;
                token.logoUrl = existing.logoUrl || token.logoUrl;
                token.backgroundUrl = existing.backgroundUrl || token.backgroundUrl;
                token.isActive = existing.is_active;
                token.emailVerified = existing.student?.email_verified;
                token.studentStatus = existing.student?.student_status;
                token.verificationStatus = existing.student?.verification_status;
                token.companyRegistrationStatus = existing.company?.registration_status;
              }
            }
          } catch (err) {
            console.log('Error fetching role during update:', err);
          }
        }

        if (session?.user?.logoUrl) token.logoUrl = session.user.logoUrl;
        if (session?.user?.emailVerified !== undefined) token.emailVerified = session.user.emailVerified;
        if (session?.user?.verificationStatus) token.verificationStatus = session.user.verificationStatus;
        if (session?.user?.companyRegistrationStatus) token.companyRegistrationStatus = session.user.companyRegistrationStatus;
      }

      if (account?.provider === "google") {
        const existingUser = await prisma.account.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            username: true,
            logoUrl: true,
            backgroundUrl: true,
            is_active: true,
            accountRole: { select: { name: true } },
            student: { select: { email_verified: true, student_status: true, verification_status: true } },
            company: { select: { registration_status: true } }
          }
        })
        if (existingUser) {
          if (!existingUser.is_active) throw new Error("ACCOUNT_DISABLED:Your account has been disabled.");
          token.sub = existingUser.id.toString();
          token.role = existingUser.accountRole?.name;
          token.username = existingUser.username || undefined;
          token.logoUrl = existingUser.logoUrl || undefined;
          token.backgroundUrl = existingUser.backgroundUrl || undefined;
          token.isActive = existingUser.is_active;
          token.emailVerified = existingUser.student?.email_verified;
          token.studentStatus = existingUser.student?.student_status;
          token.verificationStatus = existingUser.student?.verification_status;
          token.companyRegistrationStatus = existingUser.company?.registration_status;
        }
      }

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
                company: { select: { registration_status: true } }
              }
            });
            if (existing) {
              token.role = existing.accountRole?.name || token.role;
              token.username = existing.username || token.username;
              token.logoUrl = existing.logoUrl || token.logoUrl;
              token.backgroundUrl = existing.backgroundUrl || token.backgroundUrl;
              token.isActive = existing.is_active;
              token.emailVerified = existing.student?.email_verified;
              token.studentStatus = existing.student?.student_status;
              token.verificationStatus = existing.student?.verification_status;
              token.companyRegistrationStatus = existing.company?.registration_status;
            }
          }
        } catch (err) {
          console.log('Error populating token from DB:', err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.logoUrl = token.logoUrl as string;
        session.user.backgroundUrl = token.backgroundUrl as string;
        session.user.isActive = token.isActive;
        session.user.emailVerified = token.emailVerified;
        session.user.studentStatus = token.studentStatus;
        session.user.verificationStatus = token.verificationStatus;
        session.user.companyRegistrationStatus = token.companyRegistrationStatus;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.account.findUnique({
            where: { email: user.email! },
            select: {
              id: true,
              role: true,
              student: { select: { id: true } },
              company: { select: { id: true } }
            }
          });

          if (!existingUser) {
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
            return true;
          }

          if (!existingUser.role) return true;

          const roleRecord = await prisma.accountRole.findUnique({ where: { id: existingUser.role } });
          const roleName = roleRecord?.name?.toLowerCase();

          if (roleName === "student" && !existingUser.student) return true;
          if (roleName === "company" && !existingUser.company) return true;

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
