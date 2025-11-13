import { useState, useEffect } from "react";

/**
 * Custom hook for managing dismissible banner state with localStorage persistence
 * @param bannerKey - Unique key identifying this banner state
 * @param storageKey - localStorage key to use for persistence (default: "dismissedBanner")
 * @returns Object with isDismissed state and handleDismiss function
 */
export function useDismissibleBanner(bannerKey: string, storageKey: string = "dismissedBanner") {
  const [isDismissed, setIsDismissed] = useState(false);

  // Load dismissed state from localStorage on mount
  // Store dismissal per banner key so it shows again when state changes
  useEffect(() => {
    const dismissedKey = localStorage.getItem(storageKey);
    if (dismissedKey === bannerKey) {
      setIsDismissed(true);
    } else {
      // Banner state changed, show banner again
      setIsDismissed(false);
    }
  }, [bannerKey, storageKey]);

  // Handle dismiss - store the current banner key
  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(storageKey, bannerKey);
  };

  return { isDismissed, handleDismiss };
}
