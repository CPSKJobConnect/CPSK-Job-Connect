"use client"
import { AuthForm } from "@/components/auth/AuthForm"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Role } from "@/types/auth"
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
    <AuthLayout role={role as Role} mode="login">
      <AuthForm mode="login" role={role as Role} />
    </AuthLayout>
  )
}

export default LoginPage