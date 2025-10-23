"use client"

import { Role } from "@/types/auth"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: Role
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading the session

    if (!session) {
      router.push("/")
      return
    }

    if (requiredRole && session.user.role !== requiredRole) {
      router.push(`/${session.user.role}/dashboard`)
      return
    }
  }, [session, status, router, requiredRole])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session || (requiredRole && session.user.role !== requiredRole)) {
    return null
  }

  return <>{children}</>
}