// src/hooks/useConsent.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UseConsentResult = {
  loading: boolean;
  consent: boolean;
  showPrompt?: boolean;
  setConsent?: (v: boolean) => void;
  setShowPrompt?: (v: boolean) => void;
  recheck?: () => Promise<void>;
};


export function useConsent(required = true): UseConsentResult {
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const res = await fetch("/api/consent/status", {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json",
          },
        });

        if (!res.ok) {
          // If server returns error, treat as no consent
          if (mounted) {
            setConsent(false);
            if (required) setShowPrompt(true);
          }
          return;
        }

        const json = await res.json();
        const has = Boolean(json?.consent);

        if (!mounted) return;

        setConsent(has);

        if (required && !has) {
          // prompt user with privacy modal (pages decide how to show it)
          setShowPrompt(true);
        }
      } catch (err) {
        // network or other error -> treat as no consent for required pages
        if (mounted) {
          setConsent(false);
          if (required) setShowPrompt(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    check();

    return () => {
      mounted = false;
    };
  }, [required, router]);

  async function recheck() {
    let mounted = true;
    try {
      const res = await fetch("/api/consent/status", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        if (mounted) {
          setConsent(false);
          if (required) setShowPrompt(true);
        }
        return;
      }
      const json = await res.json();
      const has = Boolean(json?.consent);
      if (mounted) {
        setConsent(has);
        if (required && !has) setShowPrompt(true);
        else setShowPrompt(false);
      }
    } catch (err) {
      if (mounted) {
        setConsent(false);
        if (required) setShowPrompt(true);
      }
    }
  }

  return { loading, consent, showPrompt, setConsent, setShowPrompt, recheck } as UseConsentResult & {
    showPrompt: boolean;
    setConsent: (v: boolean) => void;
    setShowPrompt: (v: boolean) => void;
    recheck: () => Promise<void>;
  };
}

export default useConsent;
