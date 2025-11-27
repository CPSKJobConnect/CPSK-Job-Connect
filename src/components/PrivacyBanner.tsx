"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'pdpaBannerDismissed'

type PrivacyBannerProps = {
  onDismiss?: () => void
  initialVisible?: boolean
}

/**
 * Informational privacy banner for unauthenticated users.
 * Does NOT collect consent - consent is collected after login via ConsentProvider.
 * Simply informs users about privacy policy and can be dismissed.
 */
export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({ onDismiss, initialVisible = true }) => {
  const [visible, setVisible] = useState<boolean>(false)
  const [checked, setChecked] = useState<boolean>(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      if (dismissed === 'true') {
        setVisible(false)
      } else {
        setVisible(initialVisible)
      }
    } catch {
      setVisible(initialVisible)
    } finally {
      setChecked(true)
    }
  }, [initialVisible])

  if (!checked) return null

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // ignore localStorage errors
    }
    onDismiss?.()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-6xl">
      <div className="mx-auto rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">We value your privacy</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              By using our platform, you agree to our data collection practices.{' '}
              <Link href="/privacy-policy" className="text-blue-600 hover:underline">
                Read our Privacy Policy
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/privacy-policy"
              className="text-sm px-3 py-2 rounded-md text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Learn more
            </Link>

            <button
              type="button"
              className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
              onClick={handleDismiss}
              aria-label="Dismiss privacy banner"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyBanner
