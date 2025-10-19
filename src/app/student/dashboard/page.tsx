"use client"

import { signOut, useSession } from "next-auth/react"

const StudentDashboardPage = () => {
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
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-gray-700">
            <span className="font-medium">Welcome back,</span> {session.user.name || session.user.email}
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Profile</h2>
          <p className="text-blue-700 text-sm">Manage your student profile and information</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h2 className="text-lg font-semibold text-green-900 mb-2">Job Search</h2>
          <p className="text-green-700 text-sm">Browse and apply for available positions</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <h2 className="text-lg font-semibold text-purple-900 mb-2">Applications</h2>
          <p className="text-purple-700 text-sm">Track your job applications and status</p>
        </div>
      </div>
      

    </div>
    

  )
}

export default StudentDashboardPage