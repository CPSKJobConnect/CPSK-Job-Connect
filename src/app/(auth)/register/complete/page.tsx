"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building, GraduationCap, ArrowLeft, LogOut } from "lucide-react"

export default function CompleteRegistrationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<"student" | "company" | null>(null)

  // If user already has a role, redirect to dashboard
  useEffect(() => {
    if (session?.user?.role) {
      const role = session.user.role.toLowerCase()
      router.push(`/${role}/dashboard`)
    }
  }, [session, router])

  // Redirect to home if no session
  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push("/")
    }
  }, [session, status, router])

  // Redirect to role-specific registration form when role is selected
  useEffect(() => {
    if (selectedRole) {
      router.push(`/register/complete/${selectedRole}`)
    }
  }, [selectedRole, router])

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

  if (selectedRole) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl mx-auto">
        {/* Back button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back to home
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Complete Your Registration
            </CardTitle>
            <div className="text-center mt-3">
              <p className="text-gray-600">
                Signed in as <strong>{session?.user?.email}</strong>
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Please select your account type to continue
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs text-gray-500 hover:text-gray-700 mt-1"
              >
                Not you? Sign out and use a different account
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              {/* Student Card */}
              <button
                onClick={() => setSelectedRole("student")}
                className="group p-8 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-xl transition-all text-center bg-white"
              >
                <div className="mb-4">
                  <GraduationCap className="w-20 h-20 mx-auto text-green-600 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  I&apos;m a Student
                </h3>
                <p className="text-sm text-gray-600">
                  Find internships, part-time jobs, and career opportunities
                </p>
                <div className="mt-4 text-xs text-gray-500">
                  For KU students and alumni
                </div>
              </button>

              {/* Company Card */}
              <button
                onClick={() => setSelectedRole("company")}
                className="group p-8 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-xl transition-all text-center bg-white"
              >
                <div className="mb-4">
                  <Building className="w-20 h-20 mx-auto text-orange-600 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  I&apos;m a Company
                </h3>
                <p className="text-sm text-gray-600">
                  Post job listings and hire talented students
                </p>
                <div className="mt-4 text-xs text-gray-500">
                  For companies and employers
                </div>
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> You can only choose one account type. This cannot be changed later.
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Tip: If you know your role, use the Student or Company registration pages directly to skip this step.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
