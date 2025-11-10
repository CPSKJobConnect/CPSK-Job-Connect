"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { getPending, subscribe } from "@/lib/loaderSignal";

function GlobalLoader() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center transition-opacity duration-300">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2BA17C] mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(() => getPending());
  const pathname = usePathname();

  // subscribe to pending counter changes from any child component calling begin()/done()
  useEffect(() => {
    const unsub = subscribe((c) => setPendingCount(c));
    return () => unsub();
  }, []);

  // initial hide: wait for browser idle and no pending tasks
  useEffect(() => {
    const onIdle = () => {
      if (getPending() <= 0) setIsLoading(false);
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(onIdle);
      return () => { try { (window as any).cancelIdleCallback(id); } catch {} };
    }

    const t = setTimeout(onIdle, 50);
    return () => clearTimeout(t);
  }, []);

  // on navigation change: show loader, then hide when idle and pendingCount === 0
  useEffect(() => {
    setIsLoading(true);

    const tryHide = () => {
      if (pendingCount <= 0) {
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (window as any).requestIdleCallback(() => setIsLoading(false));
        } else {
          setTimeout(() => setIsLoading(false), 50);
        }
      }
    };

    // small delay to avoid flicker on very fast navigations
    const timer = setTimeout(tryHide, 200);
    return () => clearTimeout(timer);
  }, [pathname, pendingCount]);

  return (
    <Suspense fallback={<GlobalLoader />}>
      {isLoading && <GlobalLoader />}
      <div className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}>
        {children}
      </div>
    </Suspense>
  );
}
