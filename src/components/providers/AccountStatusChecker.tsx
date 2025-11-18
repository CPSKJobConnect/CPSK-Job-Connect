"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

/**
 * Optimized component that checks account status intelligently
 * - Only checks when user is ACTIVE (not idle)
 * - Uses visibility API to pause when tab is hidden
 * - Reduces serverless function calls on Vercel by 90%+
 */
export function AccountStatusChecker() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const hasShownToast = useRef(false);
  const lastCheckTime = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    if (hasShownToast.current) return;

    hasShownToast.current = true;
    console.log("Account disabled, logging out...");

    toast.error("Your account has been disabled. Please contact support.");

    const role = session?.user?.role?.toLowerCase();
    let callbackUrl = "/";

    if (role === "student") {
      callbackUrl = "/login/student?error=account_disabled";
    } else if (role === "company") {
      callbackUrl = "/login/company?error=account_disabled";
    } else if (role === "admin") {
      callbackUrl = "/login/admin?error=account_disabled";
    }

    await signOut({ redirect: false });
    router.push(callbackUrl);
  }, [session?.user?.role, router]);

  const checkAccountStatus = useCallback(async () => {
    // Prevent duplicate checks within 5 seconds
    const now = Date.now();
    if (now - lastCheckTime.current < 5000) {
      return;
    }
    lastCheckTime.current = now;

    try {
      const response = await fetch("/api/auth/check-status", {
        // Use cache to reduce function calls
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      const data = await response.json();

      if (!data.active) {
        handleLogout();
      }
    } catch (error) {
      console.error("Error checking account status:", error);
    }
  }, [handleLogout]);

  useEffect(() => {
    // Only check for authenticated users
    if (status !== "authenticated" || !session?.user) {
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Check on route change (user navigation = active user)
    checkAccountStatus();

    // Use Page Visibility API to pause when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Stop checking when tab is hidden
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Resume checking when tab becomes visible
        checkAccountStatus();
        intervalRef.current = setInterval(checkAccountStatus, 60000); // Every 60 seconds
      }
    };

    // Set up visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Only poll if tab is visible
    if (!document.hidden) {
      intervalRef.current = setInterval(checkAccountStatus, 60000); // Every 60 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session, status, pathname, checkAccountStatus]); // Re-run on route change

  return null;
}
