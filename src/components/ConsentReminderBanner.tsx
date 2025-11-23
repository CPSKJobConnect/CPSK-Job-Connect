"use client"

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { AlertCircle, X } from 'lucide-react'

/**
 * ConsentReminderBanner - Shows a banner on public pages (like /jobs) for authenticated
 * users who haven't accepted the privacy policy yet.
 * Reminds them they need to accept to use dashboard features.
 */
export default function ConsentReminderBanner() {
  const { data: session, status } = useSession()
  const [consent, setConsent] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only check consent for authenticated users
    if (status !== 'authenticated' || !session?.user) {
      setLoading(false)
      return
    }

    async function checkConsent() {
      try {
        const res = await fetch('/api/consent/status', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        })

        if (res.ok) {
          const data = await res.json()
          setConsent(Boolean(data?.consent))
        } else {
          setConsent(false)
        }
      } catch {
        setConsent(false)
      } finally {
        setLoading(false)
      }
    }

    checkConsent()
  }, [status, session])

  // Don't show if:
  // - Still loading
  // - User is not authenticated
  // - User already has consent
  // - Banner was dismissed
  if (loading || status !== 'authenticated' || consent !== false || dismissed) {
    return null
  }

  const userRole = session?.user?.role?.toLowerCase()
  const dashboardUrl = userRole ? `/${userRole}/dashboard` : '/student/dashboard'

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Action required:</strong> Please accept our{' '}
              <Link href="/privacy-policy" className="underline hover:text-amber-900">
                Privacy Policy
              </Link>{' '}
              to access your dashboard and apply for jobs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={dashboardUrl}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700"
            >
              Accept & Continue
            </Link>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-1 rounded-md text-amber-600 hover:bg-amber-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
