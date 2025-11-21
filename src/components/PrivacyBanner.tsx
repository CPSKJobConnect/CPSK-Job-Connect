"use client"

import React, { useEffect, useState } from 'react'
import PrivacyModal from './PrivacyModal'

const STORAGE_KEY = 'pdpaConsent'

type PrivacyBannerProps = {
  onAccept?: () => void
  onDismiss?: () => void
  initialVisible?: boolean
}

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({ onAccept, onDismiss, initialVisible = true }) => {
  const [visible, setVisible] = useState<boolean>(false)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [checked, setChecked] = useState<boolean>(false)

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (v === 'true') {
        setVisible(false)
      } else {
        setVisible(initialVisible)
      }
    } catch (e) {
      setVisible(initialVisible)
    } finally {
      setChecked(true)
    }
  }, [initialVisible])

  if (!checked) return null

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch (e) {
      // ignore localStorage errors
    }
    onAccept?.()
    setIsModalOpen(false)
    setVisible(false)
  }

  const handleDismiss = () => {
    onDismiss?.()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-6xl">
        <div className="mx-auto rounded-t-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">We value your privacy.</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                Our website requests your consent to collect and process your data.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-sm px-3 py-2 rounded-md text-slate-700 hover:bg-slate-50 dark:text-slate-200"
                onClick={() => setIsModalOpen(true)}
                aria-label="More information about privacy"
              >
                More information
              </button>

              <button
                type="button"
                value="accept"
                className="ml-1 inline-flex items-center rounded-md bg-[#2BA17C] px-4 py-2 text-sm font-medium text-white hover:bg-[#228969]"
                onClick={handleAccept}
                aria-label="Accept privacy policy"
              >
                Accept
              </button>

              <button
                type="button"
                value="dismiss"
                className="ml-2 inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={handleDismiss}
                aria-label="Dismiss privacy banner"
              >
                <span aria-hidden>✖️</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <PrivacyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAccept={handleAccept} />
    </>
  )
}

export default PrivacyBanner
