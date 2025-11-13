"use client"

import { use, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth/AuthForm"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Role } from "@/types/auth"
import { notFound } from "next/navigation"

interface CompleteRegistrationPageProps {
  params: Promise<{
    role: string
  }>
}

export default function CompleteRegistrationPage({ params }: CompleteRegistrationPageProps) {
  const { role } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Validate role
  if (!["student", "company"].includes(role)) {
    notFound()
  }

  // Check if user is authenticated
  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push("/")
    }
  }, [session, status, router])

  // Check if user already has a role
  useEffect(() => {
    if (session?.user?.role) {
      const userRole = session.user.role.toLowerCase()
      router.push(`/${userRole}/dashboard`)
    }
  }, [session, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <AuthLayout role={role as Role} mode="register">
      <AuthForm mode="register" role={role as Role} isOAuthCompletion={true} />
    </AuthLayout>
  )
}
