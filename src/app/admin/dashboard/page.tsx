"use client"

import { signOut, useSession } from "next-auth/react"

const CompanyDashboardPage = () => {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-gray-700">
            <span className="font-medium">Welcome back,</span> {session.user.username || session.user.email}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Email:</span> {session.user.email}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Role:</span> {session.user.role}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">User ID:</span> {session.user.id}
          </p>
          <div className="flex items-center space-x-2 mt-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">Authenticated</span>
          </div>
        </div>
      </div>

      
    </div>
  )
}

export default CompanyDashboardPage