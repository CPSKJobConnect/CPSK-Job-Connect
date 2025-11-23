"use client"
import { AuthForm } from "@/components/auth/AuthForm"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

const AdminLoginPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Redirect authenticated admin users away from login page
    if (status === "authenticated" && session?.user?.role?.toLowerCase() === "admin") {
      const callbackUrl = searchParams.get("callbackUrl")
      router.replace(callbackUrl || "/admin/dashboard")
    }
  }, [status, session, router, searchParams])

  // Show loading while checking session or redirecting
  if (status === "loading" || (status === "authenticated" && session?.user?.role?.toLowerCase() === "admin")) {
    return (
      <AuthLayout role="admin">
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
    <AuthLayout role="admin">
      <AuthForm mode="login" role="admin" />
    </AuthLayout>
  )
}

export default AdminLoginPage
