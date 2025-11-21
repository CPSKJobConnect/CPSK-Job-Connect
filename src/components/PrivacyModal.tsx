"use client"
import React, { useEffect, useRef } from 'react'

type PrivacyModalProps = {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose, onAccept }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    // prevent background scroll while modal is open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // focus the modal for accessibility
    setTimeout(() => containerRef.current?.focus(), 0)

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        ref={containerRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-2xl ring-1 ring-black/5 overflow-hidden"
        aria-describedby="privacy-modal-desc"
      >
        <div className="flex items-start justify-between p-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 id="privacy-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Privacy Notice
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">How we collect and use your data — short summary</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close privacy modal"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            ✖
          </button>
        </div>

        <div id="privacy-modal-desc" className="max-h-[60vh] overflow-y-auto p-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <section>
            <h3 className="font-medium text-slate-900 dark:text-slate-100">Summary</h3>
            <p className="mt-2">We collect personal data necessary to provide our service (account management, job applications, and communication). We handle your data securely and only as permitted by law or with your consent.</p>
          </section>

          <section>
            <h3 className="font-medium text-slate-900 dark:text-slate-100">What we collect</h3>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Contact details (name, email, phone)</li>
              <li>Professional documents (CV, resume, transcript) you upload</li>
              <li>Technical data (IP address, device identifiers) for security and analytics</li>
            </ul>
          </section>

          <section>
            <h3 className="font-medium text-slate-900 dark:text-slate-100">Why we use it</h3>
            <p className="mt-2">To create and manage your account, let you apply for jobs, enable companies to process applications, improve the platform, and comply with legal obligations.</p>
          </section>

          <section>
            <h3 className="font-medium text-slate-900 dark:text-slate-100">Your rights</h3>
            <p className="mt-2">You may request access, correction, deletion, or portability of your personal data, and you can withdraw consent at any time where applicable.</p>
          </section>

          <section>
            <h3 className="font-medium text-slate-900 dark:text-slate-100">Contact</h3>
            <p className="mt-2">Email: <a className="text-blue-600" href="mailto:cpskjobconnect@gmail.com">cpskjobconnect@gmail.com</a></p>
          </section>

          <section>
            <a className="text-blue-600" href="/privacy-policy">View Full Policy</a>
          </section>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button
            type="button"
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={onClose}
            aria-label="Close privacy modal"
          >
            Close
          </button>

          <button
            type="button"
            className="w-full sm:w-auto inline-flex justify-center rounded-md bg-[#2BA17C] px-4 py-2 text-sm font-medium text-white hover:bg-[#228969]"
            onClick={() => {
              onAccept()
              onClose()
            }}
            aria-label="Accept privacy policy"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

export default PrivacyModal;