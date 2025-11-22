"use client";

import React, { useEffect, useState } from "react";
import PrivacyModal from "@/components/PrivacyModal";

type Props = {
  children: React.ReactNode;
};

export default function ConsentProvider({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState(false);
  const [checking, setChecking] = useState(true);

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
    } catch (err) {
      setConsent(false);
    } finally {
      setChecking(false);
      setLoading(false);
    }
  }

  async function acceptConsent() {
    try {
      setChecking(true);
      const res = await fetch("/api/consent/accept", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        setChecking(false);
        return;
      }

      // re-check status
      await checkConsent();
    } catch (err) {
      setChecking(false);
    }
  }

  useEffect(() => {
    checkConsent();
  }, []);

  if (loading || checking) {
    return null;
  }

  if (!consent) {
    return (
      <PrivacyModal
        isOpen={true}
        onClose={() => {
          if (typeof window !== "undefined") {
            window.location.href = "/jobs";
          }
        }}
        onAccept={acceptConsent}
      />
    );
  }

  return <>{children}</>;
}
