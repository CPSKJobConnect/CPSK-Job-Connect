"use client"
import { AuthForm } from '@/components/auth/AuthForm'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Role } from '@/types/auth'
import { notFound } from 'next/navigation'
import { use } from 'react'

interface RegisterPageProps {
  params: Promise<{
    role: string
  }>
}

const RegisterPage = ({params}: RegisterPageProps) => {
  const {role} =  use(params);

  //validate
  if (!["student", "company"].includes(role)) {
    notFound();
  }
  return (
    <AuthLayout role={role as Role}>
      <AuthForm mode="register" role={role as Role} />
    </AuthLayout>
  )
}

export default RegisterPage