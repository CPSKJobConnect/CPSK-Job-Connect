// components/layout/AuthLayout.tsx
"use client"

import { UserRole } from "@/types/auth"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
  role: UserRole
}

export function AuthLayout({ children, role }: AuthLayoutProps) {
  const config = role === "student" 
    ? {
        bgGradient: "from-green-50 to-blue-50",
        illustrationSrc: "/assets/images/student_auth_illustration.svg"
      }
    : {
        bgGradient: "from-orange-50 to-red-50", 
        illustrationSrc: "/assets/images/company_auth_illustration.svg"
      }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} flex items-center justify-center p-4`}>
      <div className="w-full max-w-6xl mx-auto">
        {/* Back to home link */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Illustration */}
          <div className="hidden lg:block">
            <div className="relative">
              <Image
                src={config.illustrationSrc}
                alt="Authentication illustration"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Form */}
          <div className="flex justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}