// components/layout/AuthLayout.tsx
"use client"

import { UserRole } from "@/types/auth"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

interface AuthLayoutProps {
  children: React.ReactNode
  role: UserRole
}

export function AuthLayout({ children, role }: AuthLayoutProps) {
  const router = useRouter()

  const config = useMemo(() => {
    switch (role) {
      case "student":
        return {
          bgGradient: "from-green-50 to-blue-50",
          illustrationSrc: "/assets/images/student_auth_illustration.svg"
        }
      case "company":
        return {
          bgGradient: "from-orange-50 to-red-50",
          illustrationSrc: "/assets/images/company_auth_illustration.svg"
        }
      case "admin":
        return {
          bgGradient: "from-blue-50 to-indigo-50",
          illustrationSrc: "/assets/images/admin_auth_illustration.svg"
        }
      default:
        return {
          bgGradient: "from-blue-50 to-indigo-50",
          illustrationSrc: "/assets/images/admin_auth_illustration.svg"
        }
    }
  }, [role])

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} flex items-center justify-center p-4`}>
      <div className="w-full max-w-6xl mx-auto">
        {/* Go back button */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </button>
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