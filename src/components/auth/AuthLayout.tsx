// components/layout/AuthLayout.tsx
"use client"

import { Role } from "@/types/auth"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

interface AuthLayoutProps {
  children: React.ReactNode
  role: Role
  mode?: "login" | "register"
}

export function AuthLayout({ children, role, mode = "login" }: AuthLayoutProps) {
  const router = useRouter()

  const config = useMemo(() => {
    switch (role) {
      case "student":
        return {
          bgGradient: "from-green-50 to-blue-50",
          illustrationSrc: "/assets/images/student_auth_illustration.svg",
          title: "Student",
          otherRole: "company",
          otherTitle: "Company",
          bannerColor: "bg-green-50 border-green-200 text-green-900"
        }
      case "company":
        return {
          bgGradient: "from-orange-50 to-red-50",
          illustrationSrc: "/assets/images/company_auth_illustration.svg",
          title: "Company",
          otherRole: "student",
          otherTitle: "Student",
          bannerColor: "bg-orange-50 border-orange-200 text-orange-900"
        }
      case "admin":
        return {
          bgGradient: "from-blue-50 to-indigo-50",
          illustrationSrc: "/assets/images/admin_auth_illustration.svg",
          title: "Admin",
          otherRole: "",
          otherTitle: "",
          bannerColor: "bg-blue-50 border-blue-200 text-blue-900"
        }
      default:
        return {
          bgGradient: "from-blue-50 to-indigo-50",
          illustrationSrc: "/assets/images/admin_auth_illustration.svg",
          title: "Admin",
          otherRole: "",
          otherTitle: "",
          bannerColor: "bg-blue-50 border-blue-200 text-blue-900"
        }
    }
  }, [role])

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} flex items-center justify-center p-4`}>
      <div className="w-full max-w-6xl mx-auto">
        {/* Go back button */}
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </button>
        </div>

        {/* Info banner for non-admin roles */}
        {role !== "admin" && config.otherRole && (
          <div className={`mb-6 p-4 ${config.bannerColor} border rounded-lg`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm font-medium">
                <strong>{config.title} {mode === "login" ? "Login" : "Registration"}</strong> - {role === "student" ? "For KU students and alumni" : "For companies and employers"}
              </p>
              <Link
                href={`/${mode}/${config.otherRole}`}
                className="text-sm underline hover:no-underline whitespace-nowrap"
              >
                Looking for {config.otherTitle} {mode === "login" ? "login" : "registration"}?
              </Link>
            </div>
          </div>
        )}

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