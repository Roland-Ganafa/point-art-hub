import { useState, useEffect } from 'react';
import { 
  storeOfflineData, 
  getOfflineData, 
  removeOfflineData,
  queueForSync,
  getPendingSyncItems,
  removeFromSyncQueue
} from '@/utils/offlineStorage';
import { supabase } from '@/integrations/supabase/client';

interface OfflineGiftSale {
  id: string;
  date: string;
  item: string;
  code: string | null;
  quantity: number;
  unit: string;
  bpx: number;
  spx: number;
  sold_by: string | null;
}

interface PendingSyncItem {
  id: number;
  endpoint: string;
  data: any;
  timestamp: string;
}

/**
 * Custom hook for handling offline gift sales data
 * Allows recording gift sales when offline and syncing when online
 */
export const useOfflineGiftSales = () => {
  const [offlineGiftSales, setOfflineGiftSales] = useState<OfflineGiftSale[]>([]);
  const [pendingSyncItems, setPendingSyncItems] = useState<PendingSyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load offline gift sales from storage on mount
  useEffect(() => {
    loadOfflineGiftSales();
    loadPendingSyncItems();
  }, []);

  const loadOfflineGiftSales = () => {
    try {
      const sales = getOfflineData('offline_gift_sales') || [];
      setOfflineGiftSales(sales);
    } catch (error) {
      console.error('Error loading offline gift sales:', error);
    }
  };

  const loadPendingSyncItems = () => {
    try {
      const items = getPendingSyncItems();
      setPendingSyncItems(items);
    } catch (error) {
      console.error('Error loading pending sync items:', error);
    }
  };

  // Record a gift sale while offline
  const recordOfflineGiftSale = (saleData: Omit<OfflineGiftSale, 'id' | 'date'>) => {
    try {
      const newSale: OfflineGiftSale = {
        ...saleData,
        id: `offline_${Date.now()}`,
        date: new Date().toISOString()
      };

      const updatedSales = [...offlineGiftSales, newSale];
      setOfflineGiftSales(updatedSales);
      storeOfflineData('offline_gift_sales', updatedSales);

      // Queue for sync when online
      queueForSync(newSale, '/api/gift-sales');
      
      return newSale;
    } catch (error) {
      console.error('Error recording offline gift sale:', error);
      throw error;
    }
  };

  // Sync offline gift sales when online
  const syncOfflineGiftSales = async () => {
    const pendingItems = getPendingSyncItems();
    if (offlineGiftSales.length === 0 && pendingItems.length === 0) return;

    setIsSyncing(true);

    try {
      let allSynced = true;

      // Process each pending item
      for (const item of pendingItems) {
        if (item.endpoint === '/api/gift-sales') {
          // Insert sale into Supabase
          const { error } = await supabase
            .from('gift_daily_sales')
            .insert([item.data]);

          if (!error) {
            // Remove from sync queue only if this item succeeded
            removeFromSyncQueue(item.id);
          } else {
            allSynced = false;
            console.error('Error syncing item:', item.id, error);
          }
        }
      }

      // Only clear offline data if every item synced successfully
      if (allSynced) {
        removeOfflineData('offline_gift_sales');
        setOfflineGiftSales([]);
      }

      // Reload pending items to reflect current queue state
      loadPendingSyncItems();

      return allSynced;
    } catch (error) {
      console.error('Error syncing offline gift sales:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Clear all offline gift sales
  const clearOfflineGiftSales = () => {
    try {
      removeOfflineData('offline_gift_sales');
      setOfflineGiftSales([]);
    } catch (error) {
      console.error('Error clearing offline gift sales:', error);
    }
  };

  return {
    offlineGiftSales,
    pendingSyncItems,
    isSyncing,
    recordOfflineGiftSale,
    syncOfflineGiftSales,
    clearOfflineGiftSales,
    loadOfflineGiftSales,
    loadPendingSyncItems
  };
};

export default useOfflineGiftSales;