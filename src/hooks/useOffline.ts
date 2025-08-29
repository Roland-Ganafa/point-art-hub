import { useState, useEffect } from 'react';

interface OfflineStatus {
  isOffline: boolean;
  isOnline: boolean;
}

/**
 * Custom hook to detect online/offline status
 * Provides real-time network status updates
 */
export const useOffline = (): OfflineStatus => {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOffline,
    isOnline: !isOffline
  };
};

export default useOffline;