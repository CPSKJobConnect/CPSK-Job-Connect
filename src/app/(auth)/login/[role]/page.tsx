"use client"
import { AuthForm } from "@/components/auth/AuthForm"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { UserRole } from "@/types/auth"
import { notFound } from "next/navigation"
import { use } from "react"

interface LoginPageProps {
  params: Promise<{
    role: string
  }>
}

const LoginPage =  ({params}: LoginPageProps) => {
  const {role} = use(params)

  if (!["student", "company"].includes(role)) {
    notFound();
  }
  return (
    <AuthLayout role={role as UserRole}>
      <AuthForm mode="login" role={role as UserRole} />
    </AuthLayout>
  )
}

export default LoginPage