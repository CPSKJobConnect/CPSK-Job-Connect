"use client"
import { AuthForm } from "@/components/auth/AuthForm"
import { AuthLayout } from "@/components/auth/AuthLayout"

const AdminLoginPage = () => {
  return (
    <AuthLayout role="admin">
      <AuthForm mode="login" role="admin" />
    </AuthLayout>
  )
}

export default AdminLoginPage
