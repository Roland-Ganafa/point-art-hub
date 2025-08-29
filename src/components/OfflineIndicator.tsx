import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { WifiOff } from 'lucide-react';

/**
 * OfflineIndicator Component
 * Displays a visual indicator when the user is offline
 * Provides notifications about connection status
 */
const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "You're back online. All features are now available.",
        variant: "success",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connection Lost",
        description: "You're offline. Some features may be limited.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
        <WifiOff className="h-4 w-4" />
        <span>Offline Mode</span>
      </div>
    </div>
  );
};

export default OfflineIndicator;