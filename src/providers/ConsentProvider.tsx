"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type Props = {
  children: React.ReactNode;
};

/**
 * ConsentProvider - Wraps protected routes (student/company dashboards)
 * Shows a consent modal for authenticated users who haven't accepted the privacy policy.
 * Users must accept to access protected features.
 */
export default function ConsentProvider({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function checkConsent() {
    try {
      const res = await fetch("/api/consent/status", {
        method: "GET",
        credentials: "include",
        headers: { "Accept": "application/json" },
      });

      if (!res.ok) {
        setConsent(false);
        return;
      }

      const data = await res.json();
      setConsent(Boolean(data?.consent));
    } catch {
      setConsent(false);
    } finally {
      setChecking(false);
      setLoading(false);
    }
  }

  async function acceptConsent() {
    try {
      setSubmitting(true);
      const res = await fetch("/api/consent/update-status", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });

      if (!res.ok) {
        toast.error("Failed to save consent. Please try again.");
        await checkConsent();
        return;
      }

      toast.success("Privacy policy accepted. Welcome!");
      await checkConsent();
    } catch {
      toast.error("Network error. Please try again.");
      await checkConsent();
    } finally {
      setSubmitting(false);
    }
  }

  async function declineConsent() {
    try {
      setSubmitting(true);
      await fetch('/api/consent/update-status', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: false }),
      });
    } catch {
      // network error - continue with redirect anyway
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    checkConsent();
  }, []);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!consent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
        <div className="relative z-10 w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Privacy Policy Consent Required
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              To use CPSK Job Connect, please review and accept our privacy policy.
            </p>
          </div>

          {/* Content */}
          <div className="max-h-[50vh] overflow-y-auto p-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
            <section>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 text-base">What we collect</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Contact details (name, email, phone number)</li>
                <li>Professional documents (CV, resume, transcript) you upload</li>
                <li>Job application history and preferences</li>
                <li>Technical data (IP address, device info) for security</li>
              </ul>
            </section>

            <section>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 text-base">How we use your data</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>To manage your account and profile</li>
                <li>To enable job applications and company matching</li>
                <li>To communicate important updates</li>
                <li>To improve our platform and ensure security</li>
              </ul>
            </section>

            <section>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 text-base">Your rights</h3>
              <p className="mt-2">
                You may request access, correction, deletion, or portability of your personal data at any time.
                You can withdraw consent by contacting us.
              </p>
            </section>

            <section className="pt-2">
              <Link
                href="/privacy-policy"
                target="_blank"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                Read Full Privacy Policy →
              </Link>
            </section>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400 self-center">
              By clicking Accept, you agree to our privacy policy.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={submitting}
                className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                onClick={async () => {
                  await declineConsent();
                  toast.info("You must accept the privacy policy to use the dashboard. Redirecting to jobs page...", {
                    duration: 4000,
                  });
                  setTimeout(() => {
                    if (typeof window !== "undefined") {
                      window.location.href = "/jobs";
                    }
                  }, 1500);
                }}
              >
                Decline
              </button>

              <button
                type="button"
                disabled={submitting}
                className="inline-flex justify-center rounded-md bg-[#2BA17C] px-6 py-2 text-sm font-medium text-white hover:bg-[#228969] disabled:opacity-50"
                onClick={acceptConsent}
              >
                {submitting ? "Saving..." : "Accept & Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
