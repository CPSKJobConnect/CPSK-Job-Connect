// lib/auth.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { loginSchema } from "./validations"
import { Role } from "@/types/auth"

const prisma = new PrismaClient()

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          const { email, password } = loginSchema.parse(credentials)
          const role = credentials?.role as Role

          // Find user account
          const account = await prisma.account.findUnique({
            where: { email },
            include: {
              accountRole: true,
              student: true,
              company: true,
            },
          })

          if (!account) return null

          // Verify password
          const isValid = await bcrypt.compare(password, account.password)
          if (!isValid) return null

          // Check role match
          const userRole = account.accountRole?.name.toLowerCase()
          if (userRole !== role) return null

          // Return user object
          return {
            id: account.id.toString(),
            email: account.email,
            name: account.username,
            role: userRole as Role,
            profileComplete: !!(account.student || account.company),
          }
        } catch (error) {
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.profileComplete = user.profileComplete
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.profileComplete = token.profileComplete
      }
      return session
    }
  },
  pages: {
    signIn: '/', // Redirect to home for role selection
  },
  session: {
    strategy: "jwt",
  },
})

// Utility functions
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Authentication required')
  }
  return session
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Insufficient permissions')
  }
  return session
}

export async function getUserWithProfile(userId: number) {
  return await prisma.account.findUnique({
    where: { id: userId },
    include: {
      accountRole: true,
      student: true,
      company: true,
    },
  })
}