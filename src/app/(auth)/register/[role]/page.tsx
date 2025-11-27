"use client"
import { AuthForm } from '@/components/auth/AuthForm'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ROLE_CONFIGS } from "@/lib/role-config"
import { Role } from '@/types/auth'
import { useSession } from "next-auth/react"
import { notFound, useRouter } from 'next/navigation'
import { use, useEffect } from 'react'

interface RegisterPageProps {
  params: Promise<{
    role: string
  }>
}

const RegisterPage = ({params}: RegisterPageProps) => {
  const {role} =  use(params);
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Redirect authenticated users away from register page
    if (status === "authenticated" && session?.user?.role) {
      const userRole = session.user.role.toLowerCase() as Role
      const roleConfig = ROLE_CONFIGS[userRole]
      router.replace(roleConfig?.redirectPath || `/${userRole}/dashboard`)
    } else if (status === "authenticated" && !session?.user?.role) {
      // User is authenticated but has no role - redirect to complete registration
      router.replace(`/register/complete/${role}`)
    }
  }, [status, session, router, role])

  //validate
  if (!["student", "company"].includes(role)) {
    notFound();
  }

  // Show loading while checking session or redirecting
  if (status === "loading" || (status === "authenticated" && session?.user)) {
    return (
      <AuthLayout role={role as Role} mode="register">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting...</p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout role={role as Role} mode="register">
      <AuthForm mode="register" role={role as Role} />
    </AuthLayout>
  )
}

export default RegisterPage