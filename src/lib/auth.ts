import { prisma } from "@/lib/db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google"
import bycrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";

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
            accountRole: {
              select: {
                name: true
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
          image: user.logoUrl,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({token, user, account}) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
      }

      // for OAuth users
      if (account?.provider === "google") {
        const existingUser = await prisma.account.findUnique({
          where: {
            email: user.email!
          },
          select: {
            username: true,
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
        }
      }
      return token;
    },
    async session({session, token}) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.username = token.username as string
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