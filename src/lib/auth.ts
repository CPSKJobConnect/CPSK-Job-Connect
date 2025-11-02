import { prisma } from "@/lib/db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bycrypt from "bcryptjs";
import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt"
  },
  providers : [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
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
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Invalid credentials");
          return null;
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
            }
          }
        });
        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bycrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          return null;
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
        } as User
      },
    }),
  ],
  callbacks: {
    async jwt({token, user, account, trigger, session}) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
        token.logoUrl = user.logoUrl;
        token.backgroundUrl = user.backgroundUrl;
        token.emailVerified = typeof user.emailVerified === 'boolean' ? user.emailVerified : undefined;
        token.studentStatus = user.studentStatus;
        token.verificationStatus = user.verificationStatus;
      }

      // Handle session update (when profile image is changed or verification status changes)
      if (trigger === "update") {
        if (session?.user?.logoUrl) {
          token.logoUrl = session.user.logoUrl;
        }
        if (session?.user?.emailVerified !== undefined) {
          token.emailVerified = session.user.emailVerified;
        }
        if (session?.user?.verificationStatus) {
          token.verificationStatus = session.user.verificationStatus;
        }
      }

      // for OAuth users
      if (account?.provider === "google") {
        const existingUser = await prisma.account.findUnique({
          where: {
            email: user.email!
          },
          select: {
            username: true,
            logoUrl: true,
            backgroundUrl: true,
            accountRole: {
              select: {
                name: true
              }
            }
          }
        })
        if (existingUser) {
          token.role = existingUser.accountRole?.name
          token.username = existingUser.username || undefined
          token.logoUrl = existingUser.logoUrl || undefined
          token.backgroundUrl = existingUser.backgroundUrl || undefined
        }
      }
      return token;
    },
    async session({session, token}) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.username = token.username as string
        session.user.logoUrl = token.logoUrl as string
        session.user.backgroundUrl = token.backgroundUrl as string
        session.user.emailVerified = token.emailVerified
        session.user.studentStatus = token.studentStatus
        session.user.verificationStatus = token.verificationStatus
      }
      return session;
    },
    async signIn({user, account, profile}) {
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.account.findUnique({
            where: {
              email: user.email!
            },
            select: {
              id: true
            }
          })
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
            })
          }
          return true
        } catch (error) {
          console.log("Error creating user:", error);
          return false;
        }
      }
      return true;
    }
  }
}